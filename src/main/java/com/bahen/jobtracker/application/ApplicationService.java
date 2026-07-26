package com.bahen.jobtracker.application;

import com.bahen.jobtracker.application.dto.ApplicationResponse;
import com.bahen.jobtracker.application.dto.CreateApplicationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.bahen.jobtracker.application.dto.UpdateApplicationRequest;
import com.bahen.jobtracker.application.dto.ApplicationPageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Transactional
    public ApplicationResponse createApplication(CreateApplicationRequest request) {
        Application application = new Application(
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
    public ApplicationResponse getApplication(Long id) {
        return toResponse(findApplication(id));
    }

    @Transactional
    public ApplicationResponse updateApplication(
            Long id,
            UpdateApplicationRequest request
    ) {
        Application application = findApplication(id);

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
    public void deleteApplication(Long id) {
        applicationRepository.delete(findApplication(id));
    }

    private Application findApplication(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ApplicationNotFoundException(id));
    }
    @Transactional(readOnly = true)
    public ApplicationPageResponse getApplications(
            String search,
            ApplicationStatus status,
        int page,
        int size
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
