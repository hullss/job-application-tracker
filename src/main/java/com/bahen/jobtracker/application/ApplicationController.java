package com.bahen.jobtracker.application;

import com.bahen.jobtracker.application.dto.ApplicationPageResponse;
import com.bahen.jobtracker.application.dto.ApplicationResponse;
import com.bahen.jobtracker.application.dto.CreateApplicationRequest;
import com.bahen.jobtracker.application.dto.UpdateApplicationRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse createApplication(
            @Valid @RequestBody CreateApplicationRequest request
    ) {
        return applicationService.createApplication(request);
    }

    @GetMapping("/{id}")
    public ApplicationResponse getApplication(@PathVariable Long id) {
        return applicationService.getApplication(id);
    }

    @GetMapping
    public ApplicationPageResponse getApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
    ) {
        return applicationService.getApplications(search, status, page, size);
    }

    @PutMapping("/{id}")
    public ApplicationResponse updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationRequest request
    ) {
        return applicationService.updateApplication(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(@PathVariable Long id) {
        applicationService.deleteApplication(id);
    }
}
