package com.bahen.jobtracker.application.dto;

import com.bahen.jobtracker.application.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

public record CreateApplicationRequest(
        @NotBlank @Size(max = 255) String company,
        @NotBlank @Size(max = 255) String position,
        @Size(max = 2048) String jobUrl,
        String jobDescription,
        ApplicationStatus currentStatus,
        @NotNull @PastOrPresent LocalDate appliedDate,
        Instant followUpAt,
        String notes
) {
}