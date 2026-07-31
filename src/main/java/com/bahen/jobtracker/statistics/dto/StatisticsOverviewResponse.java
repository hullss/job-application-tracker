package com.bahen.jobtracker.statistics.dto;

import com.bahen.jobtracker.statistics.StatisticsPeriod;

import java.time.LocalDate;
import java.util.List;

public record StatisticsOverviewResponse(
        StatisticsPeriod period,
        LocalDate rangeStart,
        LocalDate rangeEnd,
        StatisticsSummaryResponse summary,
        List<StatusCountResponse> statusBreakdown,
        List<ApplicationTrendPointResponse> applicationsOverTime,
        FollowUpOverviewResponse followUps
) {
}