import { apiRequest } from './client'
import type { ApplicationStatus } from './applications'

export type StatisticsPeriod =
    | 'LAST_30_DAYS'
    | 'LAST_3_MONTHS'
    | 'THIS_YEAR'
    | 'ALL_TIME'

export type StatisticsSummary = {
    totalApplications: number
    activeApplications: number
    interviews: number
    offers: number
    progressRate: number
    totalApplicationsChange: number | null
    activeApplicationsChange: number | null
    interviewsChange: number | null
    offersChange: number | null
    progressRateChange: number | null
}

export type StatusCount = {
    status: ApplicationStatus
    count: number
    percentage: number
}

export type ApplicationTrendPoint = {
    date: string
    count: number
}

export type FollowUpOverview = {
    completed: number
    upcoming: number
    overdue: number
}

export type StatisticsOverview = {
    period: StatisticsPeriod
    rangeStart: string
    rangeEnd: string
    summary: StatisticsSummary
    statusBreakdown: StatusCount[]
    applicationsOverTime: ApplicationTrendPoint[]
    followUps: FollowUpOverview
}

export function getStatisticsOverview(period: StatisticsPeriod) {
    const query = new URLSearchParams({ period })

    return apiRequest<StatisticsOverview>(
        `/api/statistics/overview?${query.toString()}`,
    )
}
