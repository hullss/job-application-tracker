package com.bahen.jobtracker.calendar.dto;

import com.bahen.jobtracker.calendar.ApplicationEventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record SaveApplicationEventRequest(
        @NotNull ApplicationEventType type,
        @NotNull Instant scheduledAt,
        @Size(max = 2000) String notes
) {
}