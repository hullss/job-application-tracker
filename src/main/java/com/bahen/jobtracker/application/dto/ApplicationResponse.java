package com.bahen.jobtracker.application.dto;

import com.bahen.jobtracker.application.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;

public record ApplicationResponse(
        Long id,
        String company,
        String position,
        String jobUrl,
        String jobDescription,
        ApplicationStatus currentStatus,
        LocalDate appliedDate,
        Instant followUpAt,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}