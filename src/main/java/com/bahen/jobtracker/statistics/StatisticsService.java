package com.bahen.jobtracker.statistics;

import com.bahen.jobtracker.application.Application;
import com.bahen.jobtracker.application.ApplicationRepository;
import com.bahen.jobtracker.application.ApplicationStatus;
import com.bahen.jobtracker.calendar.ApplicationEvent;
import com.bahen.jobtracker.calendar.ApplicationEventRepository;
import com.bahen.jobtracker.calendar.ApplicationEventType;
import com.bahen.jobtracker.statistics.dto.ApplicationTrendPointResponse;
import com.bahen.jobtracker.statistics.dto.FollowUpOverviewResponse;
import com.bahen.jobtracker.statistics.dto.StatisticsOverviewResponse;
import com.bahen.jobtracker.statistics.dto.StatisticsSummaryResponse;
import com.bahen.jobtracker.statistics.dto.StatusCountResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatisticsService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationEventRepository eventRepository;

    public StatisticsService(
            ApplicationRepository applicationRepository,
            ApplicationEventRepository eventRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.eventRepository = eventRepository;
    }

    public StatisticsOverviewResponse getOverview(
            StatisticsPeriod period,
            String userEmail
    ) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DateRange range = resolveRange(period, today);

        List<Application> applications = period == StatisticsPeriod.ALL_TIME
                ? applicationRepository.findAllByOwnerEmailIgnoreCase(
                userEmail
        )
                : applicationRepository
                .findAllByOwnerEmailIgnoreCaseAndAppliedDateBetween(
                        userEmail,
                        range.currentStart(),
                        range.currentEnd()
                );

        List<Application> previousApplications =
                range.previousStart() == null
                        ? List.of()
                        : applicationRepository
                        .findAllByOwnerEmailIgnoreCaseAndAppliedDateBetween(
                                userEmail,
                                range.previousStart(),
                                range.previousEnd()
                        );

        SummaryValues currentSummary = summarize(applications);
        SummaryValues previousSummary =
                period == StatisticsPeriod.ALL_TIME
                        ? null
                        : summarize(previousApplications);

        LocalDate responseStart =
                period == StatisticsPeriod.ALL_TIME
                        ? applications.stream()
                        .map(Application::getAppliedDate)
                        .min(LocalDate::compareTo)
                        .orElse(today)
                        : range.currentStart();

        return new StatisticsOverviewResponse(
                period,
                responseStart,
                today,
                buildSummaryResponse(
                        currentSummary,
                        previousSummary
                ),
                buildStatusBreakdown(applications),
                buildTrend(applications),
                buildFollowUpOverview(userEmail)
        );
    }

    private SummaryValues summarize(
            List<Application> applications
    ) {
        long total = applications.size();

        long active = applications.stream()
                .filter(application ->
                        application.getCurrentStatus()
                                == ApplicationStatus.APPLIED
                                || application.getCurrentStatus()
                                == ApplicationStatus.INTERVIEW
                )
                .count();

        long interviews = countStatus(
                applications,
                ApplicationStatus.INTERVIEW
        );

        long offers = countStatus(
                applications,
                ApplicationStatus.OFFER
        );

        double progressRate = percentage(
                interviews + offers,
                total
        );

        return new SummaryValues(
                total,
                active,
                interviews,
                offers,
                progressRate
        );
    }

    private StatisticsSummaryResponse buildSummaryResponse(
            SummaryValues current,
            SummaryValues previous
    ) {
        return new StatisticsSummaryResponse(
                current.total(),
                current.active(),
                current.interviews(),
                current.offers(),
                current.progressRate(),
                previous == null
                        ? null
                        : current.total() - previous.total(),
                previous == null
                        ? null
                        : current.active() - previous.active(),
                previous == null
                        ? null
                        : current.interviews() - previous.interviews(),
                previous == null
                        ? null
                        : current.offers() - previous.offers(),
                previous == null
                        ? null
                        : round(
                        current.progressRate()
                        - previous.progressRate()
                )
        );
    }

    private List<StatusCountResponse> buildStatusBreakdown(
            List<Application> applications
    ) {
        long total = applications.size();

        return Arrays.stream(ApplicationStatus.values())
                .map(status -> {
                    long count = countStatus(applications, status);

                    return new StatusCountResponse(
                            status,
                            count,
                            percentage(count, total)
                    );
                })
                .toList();
    }

    private List<ApplicationTrendPointResponse> buildTrend(
            List<Application> applications
    ) {
        Map<LocalDate, Long> countsByDate = applications.stream()
                .collect(Collectors.groupingBy(
                        Application::getAppliedDate,
                        TreeMap::new,
                        Collectors.counting()
                ));

        return countsByDate.entrySet()
                .stream()
                .map(entry -> new ApplicationTrendPointResponse(
                        entry.getKey(),
                        entry.getValue()
                ))
                .toList();
    }

    private FollowUpOverviewResponse buildFollowUpOverview(
            String userEmail
    ) {
        List<ApplicationEvent> followUps =
                eventRepository.findAllForUserByType(
                        userEmail,
                        ApplicationEventType.FOLLOW_UP
                );

        Instant now = Instant.now();

        long completed = followUps.stream()
                .filter(event -> event.getCompletedAt() != null)
                .count();

        long upcoming = followUps.stream()
                .filter(event -> event.getCompletedAt() == null)
                .filter(event ->
                        !event.getScheduledAt().isBefore(now)
                )
                .count();

        long overdue = followUps.stream()
                .filter(event -> event.getCompletedAt() == null)
                .filter(event ->
                        event.getScheduledAt().isBefore(now)
                )
                .count();

        return new FollowUpOverviewResponse(
                completed,
                upcoming,
                overdue
        );
    }

    private long countStatus(
            List<Application> applications,
            ApplicationStatus status
    ) {
        return applications.stream()
                .filter(application ->
                        application.getCurrentStatus() == status
                )
                .count();
    }

    private double percentage(long value, long total) {
        if (total == 0) {
            return 0;
        }

        return round((double) value / total * 100);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private DateRange resolveRange(
            StatisticsPeriod period,
            LocalDate today
    ) {
        return switch (period) {
            case LAST_30_DAYS -> {
                LocalDate start = today.minusDays(29);
                LocalDate previousEnd = start.minusDays(1);

                yield new DateRange(
                        start,
                        today,
                        previousEnd.minusDays(29),
                        previousEnd
                );
            }

            case LAST_3_MONTHS -> {
                LocalDate start = today.minusMonths(3).plusDays(1);
                LocalDate previousEnd = start.minusDays(1);

                yield new DateRange(
                        start,
                        today,
                        start.minusMonths(3),
                        previousEnd
                );
            }

            case THIS_YEAR -> {
                LocalDate start = today.withDayOfYear(1);
                LocalDate previousToday = today.minusYears(1);

                yield new DateRange(
                        start,
                        today,
                        previousToday.withDayOfYear(1),
                        previousToday
                );
            }

            case ALL_TIME -> new DateRange(
                    null,
                    today,
                    null,
                    null
            );
        };
    }

    private record SummaryValues(
            long total,
            long active,
            long interviews,
            long offers,
            double progressRate
    ) {
    }

    private record DateRange(
            LocalDate currentStart,
            LocalDate currentEnd,
            LocalDate previousStart,
            LocalDate previousEnd
    ) {
    }
}