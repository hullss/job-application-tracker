package com.bahen.jobtracker.calendar.dto;

import com.bahen.jobtracker.calendar.ApplicationEventType;

import java.time.Instant;

public record ApplicationEventResponse(
        Long id,
        Long applicationId,
        String company,
        String position,
        ApplicationEventType type,
        Instant scheduledAt,
        Instant completedAt,
        String notes
) {
}