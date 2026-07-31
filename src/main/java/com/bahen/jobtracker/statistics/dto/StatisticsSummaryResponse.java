package com.bahen.jobtracker.statistics.dto;

public record StatisticsSummaryResponse(
        long totalApplications,
        long activeApplications,
        long interviews,
        long offers,
        double progressRate,
        Long totalApplicationsChange,
        Long activeApplicationsChange,
        Long interviewsChange,
        Long offersChange,
        Double progressRateChange
) {
}