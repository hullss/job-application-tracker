package com.bahen.jobtracker.statistics;

import com.bahen.jobtracker.statistics.dto.StatisticsOverviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(
        name = "Statistics",
        description = "Statistics for the current user's job search"
)
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(
            StatisticsService statisticsService
    ) {
        this.statisticsService = statisticsService;
    }

    @Operation(summary = "Get job application statistics")
    @GetMapping("/overview")
    public StatisticsOverviewResponse getOverview(
            @RequestParam(
                    defaultValue = "LAST_30_DAYS"
            ) StatisticsPeriod period,
            Authentication authentication
    ) {
        return statisticsService.getOverview(
                period,
                authentication.getName()
        );
    }
}