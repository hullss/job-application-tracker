package com.bahen.jobtracker.statistics.dto;

import java.time.LocalDate;

public record ApplicationTrendPointResponse(
        LocalDate date,
        long count
) {
}