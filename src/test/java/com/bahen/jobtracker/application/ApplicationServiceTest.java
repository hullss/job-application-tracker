package com.bahen.jobtracker.application;

import com.bahen.jobtracker.application.dto.CreateApplicationRequest;
import com.bahen.jobtracker.application.dto.UpdateApplicationRequest;
import com.bahen.jobtracker.user.UserAccount;
import com.bahen.jobtracker.user.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    private static final String USER_EMAIL = "test@example.com";

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    private ApplicationService applicationService;

    @BeforeEach
    void setUp() {
        applicationService = new ApplicationService(
                applicationRepository,
                userAccountRepository
        );
    }

    @Test
    void createApplicationSavesEntityWithDefaultStatus() {
        CreateApplicationRequest request = new CreateApplicationRequest(
                "Acme",
                "Java Developer",
                null,
                null,
                null,
                LocalDate.of(2026, 7, 26),
                null,
                null
        );

        when(applicationRepository.save(any(Application.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserAccount owner = createUser();

        when(userAccountRepository.findByEmailIgnoreCase(USER_EMAIL))
                .thenReturn(Optional.of(owner));

        applicationService.createApplication(request, USER_EMAIL);

        ArgumentCaptor<Application> captor =
                ArgumentCaptor.forClass(Application.class);

        verify(applicationRepository).save(captor.capture());

        Application savedApplication = captor.getValue();

        assertEquals("Acme", savedApplication.getCompany());
        assertEquals("Java Developer", savedApplication.getPosition());
        assertEquals(
                ApplicationStatus.APPLIED,
                savedApplication.getCurrentStatus()
        );
        assertEquals(USER_EMAIL, savedApplication.getOwner().getEmail());
    }

    @Test
    void createApplicationCopiesOptionalFieldsAndRequestedStatus() {
        Instant followUpAt = Instant.parse("2026-07-30T09:00:00Z");
        CreateApplicationRequest request = new CreateApplicationRequest(
                "Acme",
                "Java Developer",
                "https://example.com/jobs/1",
                "Build Spring Boot services",
                ApplicationStatus.INTERVIEW,
                LocalDate.of(2026, 7, 26),
                followUpAt,
                "Talked to the recruiter"
        );

        when(userAccountRepository.findByEmailIgnoreCase(USER_EMAIL))
                .thenReturn(Optional.of(createUser()));
        when(applicationRepository.save(any(Application.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = applicationService.createApplication(
                request,
                USER_EMAIL
        );

        assertEquals("https://example.com/jobs/1", response.jobUrl());
        assertEquals(
                "Build Spring Boot services",
                response.jobDescription()
        );
        assertEquals(ApplicationStatus.INTERVIEW, response.currentStatus());
        assertEquals(followUpAt, response.followUpAt());
        assertEquals("Talked to the recruiter", response.notes());
    }

    @Test
    void createApplicationRejectsMissingAuthenticatedUser() {
        when(userAccountRepository.findByEmailIgnoreCase(USER_EMAIL))
                .thenReturn(Optional.empty());

        assertThrows(
                UsernameNotFoundException.class,
                () -> applicationService.createApplication(
                        new CreateApplicationRequest(
                                "Acme",
                                "Java Developer",
                                null,
                                null,
                                null,
                                LocalDate.of(2026, 7, 26),
                                null,
                                null
                        ),
                        USER_EMAIL
                )
        );
    }

    @Test
    void getApplicationThrowsExceptionWhenIdDoesNotExist() {
        when(applicationRepository.findByIdAndOwnerEmailIgnoreCase(
                999L,
                USER_EMAIL
        ))
                .thenReturn(Optional.empty());

        assertThrows(
                ApplicationNotFoundException.class,
                () -> applicationService.getApplication(999L, USER_EMAIL)
        );
    }

    @Test
    void getApplicationReturnsAnOwnedApplication() {
        Application application = new Application(
                createUser(),
                "Acme",
                "Java Developer",
                LocalDate.of(2026, 7, 26)
        );

        when(applicationRepository.findByIdAndOwnerEmailIgnoreCase(
                1L,
                USER_EMAIL
        )).thenReturn(Optional.of(application));

        var response = applicationService.getApplication(1L, USER_EMAIL);

        assertEquals("Acme", response.company());
        assertEquals("Java Developer", response.position());
    }

    @Test
    void updateApplicationChangesEntityAndFlushes() {
        Application application = new Application(
                createUser(),
                "Old Company",
                "Old Position",
                LocalDate.of(2026, 7, 20)
        );

        when(applicationRepository.findByIdAndOwnerEmailIgnoreCase(
                1L,
                USER_EMAIL
        ))
                .thenReturn(Optional.of(application));

        UpdateApplicationRequest request = new UpdateApplicationRequest(
                "New Company",
                "Senior Java Developer",
                null,
                null,
                ApplicationStatus.INTERVIEW,
                LocalDate.of(2026, 7, 20),
                null,
                "Technical interview scheduled"
        );

        var response = applicationService.updateApplication(
                1L,
                request,
                USER_EMAIL
        );

        assertEquals("New Company", response.company());
        assertEquals("Senior Java Developer", response.position());
        assertEquals(ApplicationStatus.INTERVIEW, response.currentStatus());

        verify(applicationRepository).flush();
    }

    @Test
    void getApplicationsUsesEmptyStringWhenSearchIsMissing() {
        Application application = new Application(
                createUser(),
                "Acme",
                "Java Developer",
                LocalDate.of(2026, 7, 26)
        );

        Pageable pageable = PageRequest.of(0, 10);
        Page<Application> result =
                new PageImpl<>(List.of(application), pageable, 1);

        when(applicationRepository.findAllFiltered(
                eq(USER_EMAIL),
                eq(""),
                isNull(),
                any(Pageable.class)
        )).thenReturn(result);

        var response = applicationService.getApplications(
                null,
                null,
                0,
                10,
                USER_EMAIL
        );

        assertEquals(1, response.content().size());
        assertEquals("Acme", response.content().getFirst().company());
    }

    @Test
    void getApplicationsNormalizesFiltersAndUsesRequestedPage() {
        Pageable pageable = PageRequest.of(2, 5);
        Page<Application> result =
                new PageImpl<>(List.of(), pageable, 12);

        when(applicationRepository.findAllFiltered(
                eq(USER_EMAIL),
                eq("java"),
                eq(ApplicationStatus.INTERVIEW),
                any(Pageable.class)
        )).thenReturn(result);

        var response = applicationService.getApplications(
                "  JAVA  ",
                ApplicationStatus.INTERVIEW,
                2,
                5,
                USER_EMAIL
        );

        ArgumentCaptor<Pageable> captor =
                ArgumentCaptor.forClass(Pageable.class);
        verify(applicationRepository).findAllFiltered(
                eq(USER_EMAIL),
                eq("java"),
                eq(ApplicationStatus.INTERVIEW),
                captor.capture()
        );

        assertEquals(2, response.page());
        assertEquals(5, response.size());
        assertEquals(12, response.totalElements());
        assertEquals(3, response.totalPages());
        assertEquals(2, captor.getValue().getPageNumber());
        assertEquals(5, captor.getValue().getPageSize());
        assertEquals(
                "DESC",
                captor.getValue()
                        .getSort()
                        .getOrderFor("appliedDate")
                        .getDirection()
                        .name()
        );
    }

    @Test
    void deleteApplicationDeletesOnlyTheOwnedApplication() {
        Application application = new Application(
                createUser(),
                "Acme",
                "Java Developer",
                LocalDate.of(2026, 7, 26)
        );

        when(applicationRepository.findByIdAndOwnerEmailIgnoreCase(
                1L,
                USER_EMAIL
        )).thenReturn(Optional.of(application));

        applicationService.deleteApplication(1L, USER_EMAIL);

        verify(applicationRepository).delete(application);
    }

    private UserAccount createUser() {
        return new UserAccount(USER_EMAIL, "{bcrypt}password-hash");
    }
}
