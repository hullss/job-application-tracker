package com.bahen.jobtracker.application;

import com.bahen.jobtracker.application.dto.CreateApplicationRequest;
import com.bahen.jobtracker.application.dto.UpdateApplicationRequest;
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

    @Mock
    private ApplicationRepository applicationRepository;

    private ApplicationService applicationService;

    @BeforeEach
    void setUp() {
        applicationService = new ApplicationService(applicationRepository);
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

        applicationService.createApplication(request);

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
    }

    @Test
    void getApplicationThrowsExceptionWhenIdDoesNotExist() {
        when(applicationRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                ApplicationNotFoundException.class,
                () -> applicationService.getApplication(999L)
        );
    }

    @Test
    void updateApplicationChangesEntityAndFlushes() {
        Application application = new Application(
                "Old Company",
                "Old Position",
                LocalDate.of(2026, 7, 20)
        );

        when(applicationRepository.findById(1L))
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

        var response = applicationService.updateApplication(1L, request);

        assertEquals("New Company", response.company());
        assertEquals("Senior Java Developer", response.position());
        assertEquals(ApplicationStatus.INTERVIEW, response.currentStatus());

        verify(applicationRepository).flush();
    }

    @Test
    void getApplicationsUsesEmptyStringWhenSearchIsMissing() {
        Application application = new Application(
                "Acme",
                "Java Developer",
                LocalDate.of(2026, 7, 26)
        );

        Pageable pageable = PageRequest.of(0, 10);
        Page<Application> result =
                new PageImpl<>(List.of(application), pageable, 1);

        when(applicationRepository.findAllFiltered(
                eq(""),
                isNull(),
                any(Pageable.class)
        )).thenReturn(result);

        var response = applicationService.getApplications(
                null,
                null,
                0,
                10
        );

        assertEquals(1, response.content().size());
        assertEquals("Acme", response.content().getFirst().company());
    }
}