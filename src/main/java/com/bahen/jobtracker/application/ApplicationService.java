package com.bahen.jobtracker.application;

import com.bahen.jobtracker.application.dto.ApplicationResponse;
import com.bahen.jobtracker.application.dto.CreateApplicationRequest;
import com.bahen.jobtracker.application.dto.UpdateApplicationRequest;
import com.bahen.jobtracker.application.dto.ApplicationPageResponse;
import com.bahen.jobtracker.user.UserAccount;
import com.bahen.jobtracker.user.UserAccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserAccountRepository userAccountRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public ApplicationResponse createApplication(
            CreateApplicationRequest request,
            String userEmail
    ) {
        UserAccount owner = findUser(userEmail);

        Application application = new Application(
                owner,
                request.company(),
                request.position(),
                request.appliedDate()
        );

        application.setJobUrl(request.jobUrl());
        application.setJobDescription(request.jobDescription());
        application.setFollowUpAt(request.followUpAt());
        application.setNotes(request.notes());

        if (request.currentStatus() != null) {
            application.setCurrentStatus(request.currentStatus());
        }

        Application savedApplication = applicationRepository.save(application);

        return toResponse(savedApplication);
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getApplication(Long id, String userEmail) {
        return toResponse(findApplication(id, userEmail));
    }

    @Transactional
    public ApplicationResponse updateApplication(
            Long id,
            UpdateApplicationRequest request,
            String userEmail
    ) {
        Application application = findApplication(id, userEmail);

        application.setCompany(request.company());
        application.setPosition(request.position());
        application.setJobUrl(request.jobUrl());
        application.setJobDescription(request.jobDescription());
        application.setCurrentStatus(request.currentStatus());
        application.setAppliedDate(request.appliedDate());
        application.setFollowUpAt(request.followUpAt());
        application.setNotes(request.notes());
        applicationRepository.flush();
        return toResponse(application);
    }

    @Transactional
    public void deleteApplication(Long id, String userEmail) {
        applicationRepository.delete(findApplication(id, userEmail));
    }

    private Application findApplication(Long id, String userEmail) {
        return applicationRepository
                .findByIdAndOwnerEmailIgnoreCase(id, userEmail)
                .orElseThrow(() -> new ApplicationNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public ApplicationPageResponse getApplications(
            String search,
            ApplicationStatus status,
            int page,
            int size,
            String userEmail
    ) {
        String normalizedSearch = search == null || search.isBlank()
                ? ""
                : search.trim().toLowerCase();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Order.desc("appliedDate"),
                        Sort.Order.desc("id")
                )
        );

        Page<Application> result =
                applicationRepository.findAllFiltered(
                        userEmail,
                        normalizedSearch,
                        status,
                        pageable
                );

        return new ApplicationPageResponse(
                result.getContent().stream()
                        .map(this::toResponse)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private UserAccount findUser(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Authenticated user no longer exists"
                ));
    }

    private ApplicationResponse toResponse(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getCompany(),
                application.getPosition(),
                application.getJobUrl(),
                application.getJobDescription(),
                application.getCurrentStatus(),
                application.getAppliedDate(),
                application.getFollowUpAt(),
                application.getNotes(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
