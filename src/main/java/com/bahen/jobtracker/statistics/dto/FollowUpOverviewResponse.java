package com.bahen.jobtracker.statistics.dto;

public record FollowUpOverviewResponse(
        long completed,
        long upcoming,
        long overdue
) {
}