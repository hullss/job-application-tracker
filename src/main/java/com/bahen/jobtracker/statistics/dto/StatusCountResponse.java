package com.bahen.jobtracker.statistics.dto;

import com.bahen.jobtracker.application.ApplicationStatus;

public record StatusCountResponse(
        ApplicationStatus status,
        long count,
        double percentage
) {
}