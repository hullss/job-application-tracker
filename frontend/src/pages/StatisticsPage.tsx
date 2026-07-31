import {
    useEffect,
    useCallback,
    useMemo,
    useState,
    type CSSProperties,
    type FormEvent,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { ApplicationStatus } from '../api/applications'
import {
    getStatisticsOverview,
    type ApplicationTrendPoint,
    type StatisticsPeriod,
    type StatisticsSummary,
} from '../api/statistics'
import { DashboardSidebar } from '../components/DashboardSidebar'
import { ProfileMenu } from '../components/ProfileMenu'
import { useLanguage } from '../i18n/language-context'
import type { Language } from '../i18n/translations'

type ChartMode = 'area' | 'bar'

const PERIODS: StatisticsPeriod[] = [
    'LAST_30_DAYS',
    'LAST_3_MONTHS',
    'THIS_YEAR',
    'ALL_TIME',
]

const STATUSES: ApplicationStatus[] = [
    'APPLIED',
    'INTERVIEW',
    'OFFER',
    'REJECTED',
]

const LANGUAGE_LOCALES: Record<Language, string> = {
    en: 'en-US',
    uk: 'uk-UA',
    sk: 'sk-SK',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    APPLIED: 'var(--interview)',
    INTERVIEW: 'var(--primary-bright)',
    OFFER: 'var(--warning)',
    REJECTED: 'var(--danger)',
}

type SummaryCardProps = {
    label: string
    value: string | number
    change: number | null
    accent: string
    icon: string
    changeLabel: (change: number) => string
}

function SummaryCard({
    label,
    value,
    change,
    accent,
    icon,
    changeLabel,
}: SummaryCardProps) {
    const hasChange = change !== null
    const changeClass =
        change !== null && change < 0
            ? 'statistics-kpi__change--negative'
            : 'statistics-kpi__change--positive'

    return (
        <article className="statistics-kpi">
            <span
                className="statistics-kpi__icon"
                style={{ '--kpi-accent': accent } as CSSProperties}
                aria-hidden="true"
            >
                {icon}
            </span>
            <span>{label}</span>
            <strong>{value}</strong>
            {hasChange ? (
                <small className={changeClass}>
                    {changeLabel(change)}
                </small>
            ) : (
                <small className="statistics-kpi__change--neutral">—</small>
            )}
        </article>
    )
}

type TrendChartProps = {
    points: ApplicationTrendPoint[]
    mode: ChartMode
    locale: string
    emptyLabel: string
    chartLabel: string
}

function TrendChart({
    points,
    mode,
    locale,
    emptyLabel,
    chartLabel,
}: TrendChartProps) {
    const width = 760
    const height = 230
    const padding = { top: 18, right: 18, bottom: 42, left: 38 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const maxValue = Math.max(...points.map((point) => point.count), 1)
    const xFor = (index: number) =>
        padding.left +
        (points.length <= 1
            ? innerWidth / 2
            : (index / (points.length - 1)) * innerWidth)
    const yFor = (value: number) =>
        padding.top + innerHeight - (value / maxValue) * innerHeight
    const coordinates = points.map((point, index) => ({
        ...point,
        x: xFor(index),
        y: yFor(point.count),
    }))
    const polyline = coordinates
        .map((point) => `${point.x},${point.y}`)
        .join(' ')
    const areaPath = coordinates.length
        ? `M ${coordinates[0].x} ${padding.top + innerHeight} L ${polyline.replaceAll(',', ' ')} L ${coordinates.at(-1)?.x ?? padding.left} ${padding.top + innerHeight} Z`
        : ''
    const labelStep = Math.max(Math.ceil(points.length / 5), 1)
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    })

    if (points.length === 0) {
        return <div className="statistics-empty">{emptyLabel}</div>
    }

    return (
        <svg
            className="statistics-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={chartLabel}
        >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + innerHeight * ratio
                const value = Math.round(maxValue * (1 - ratio))

                return (
                    <g key={ratio}>
                        <line
                            className="statistics-chart__grid"
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                        />
                        <text
                            className="statistics-chart__label"
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                        >
                            {value}
                        </text>
                    </g>
                )
            })}

            {mode === 'area' ? (
                <>
                    <defs>
                        <linearGradient
                            id="statisticsArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0" stopColor="#8747ff" stopOpacity="0.35" />
                            <stop offset="1" stopColor="#8747ff" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        className="statistics-chart__area"
                        d={areaPath}
                    />
                    <polyline
                        className="statistics-chart__line"
                        points={polyline}
                    />
                    {coordinates.map((point) => (
                        <circle
                            className="statistics-chart__point"
                            key={point.date}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            aria-label={`${point.date}: ${point.count}`}
                        >
                            <title>{`${point.date}: ${point.count}`}</title>
                        </circle>
                    ))}
                </>
            ) : (
                coordinates.map((point) => {
                    const barWidth = Math.max(
                        Math.min(innerWidth / points.length - 4, 38),
                        5,
                    )

                    return (
                        <rect
                            className="statistics-chart__bar"
                            key={point.date}
                            x={point.x - barWidth / 2}
                            y={point.y}
                            width={barWidth}
                            height={padding.top + innerHeight - point.y}
                            rx="3"
                            aria-label={`${point.date}: ${point.count}`}
                        >
                            <title>{`${point.date}: ${point.count}`}</title>
                        </rect>
                    )
                })
            )}

            {coordinates.map((point, index) =>
                index % labelStep === 0 || index === points.length - 1 ? (
                    <text
                        className="statistics-chart__label"
                        key={`label-${point.date}`}
                        x={point.x}
                        y={height - 13}
                        textAnchor="middle"
                    >
                        {dateFormatter.format(
                            new Date(`${point.date}T00:00:00Z`),
                        )}
                    </text>
                ) : null,
            )}
        </svg>
    )
}

function formatChange(
    value: number,
    translate: (key: string, values?: Record<string, string | number>) => string,
) {
    if (value === 0) {
        return translate('statistics.noChange')
    }

    return translate('statistics.change', {
        value: `${value > 0 ? '+' : ''}${Math.round(value * 10) / 10}`,
    })
}

export function StatisticsPage() {
    const navigate = useNavigate()
    const { language, t } = useLanguage()
    const locale = LANGUAGE_LOCALES[language]
    const [period, setPeriod] =
        useState<StatisticsPeriod>('LAST_30_DAYS')
    const [chartMode, setChartMode] = useState<ChartMode>('area')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<ApplicationStatus | ''>('')

    const statisticsQuery = useQuery({
        queryKey: ['statistics', period],
        queryFn: () => getStatisticsOverview(period),
    })

    const overview = statisticsQuery.data
    const cumulativeTrend = useMemo(
        () =>
            (overview?.applicationsOverTime ?? []).map(
                (point, index, points) => ({
                    ...point,
                    count: points
                        .slice(0, index + 1)
                        .reduce(
                            (total, current) => total + current.count,
                            0,
                        ),
                }),
            ),
        [overview?.applicationsOverTime],
    )
    const statusByName = useMemo(
        () =>
            new Map(
                (overview?.statusBreakdown ?? []).map((item) => [
                    item.status,
                    item,
                ]),
            ),
        [overview?.statusBreakdown],
    )

    const donutBackground = useMemo(() => {
        if (!overview || overview.summary.totalApplications === 0) {
            return 'var(--surface-soft)'
        }

        let offset = 0
        const segments = STATUSES.map((item) => {
            const percentage = statusByName.get(item)?.percentage ?? 0
            const start = offset
            offset += percentage
            return `${STATUS_COLORS[item]} ${start}% ${offset}%`
        })

        return `conic-gradient(${segments.join(', ')})`
    }, [overview, statusByName])

    function logout() {
        localStorage.removeItem('accessToken')
        navigate('/login', { replace: true })
    }

    function openApplications(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        navigateToApplications(search, status)
    }

    const navigateToApplications = useCallback(
        (
            searchValue: string,
            statusValue: ApplicationStatus | '',
        ) => {
            const query = new URLSearchParams()
            const normalizedSearch = searchValue.trim()

            if (normalizedSearch.length >= 2) {
                query.set('search', normalizedSearch)
            }
            if (statusValue) {
                query.set('status', statusValue)
            }

            const suffix =
                query.size > 0 ? `?${query.toString()}` : ''
            navigate(`/applications${suffix}`)
        },
        [navigate],
    )

    useEffect(() => {
        const normalizedSearch = search.trim()

        if (normalizedSearch.length < 2) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            navigateToApplications(normalizedSearch, status)
        }, 300)

        return () => window.clearTimeout(timeoutId)
    }, [navigateToApplications, search, status])

    const summary: StatisticsSummary | undefined = overview?.summary
    const numberFormatter = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
    })
    const totalFollowUps = overview
        ? overview.followUps.completed +
          overview.followUps.upcoming +
          overview.followUps.overdue
        : 0

    return (
        <main className="dashboard-page">
            <DashboardSidebar
                active="statistics"
                onAddApplication={() =>
                    navigate('/applications?add=true')
                }
                onLogout={logout}
            />

            <section className="dashboard-workspace">
                <header className="dashboard-header">
                    <div className="dashboard-header__inner">
                        <div className="dashboard-header__title">
                            <strong>{t('statistics.title')}</strong>
                            <span>{t('statistics.subtitle')}</span>
                        </div>

                        <div className="dashboard-header__actions">
                            <form
                                className="header-filter"
                                onSubmit={openApplications}
                            >
                                <label className="header-search">
                                    <span className="sr-only">
                                        {t('filter.searchLabel')}
                                    </span>
                                    <span aria-hidden="true">⌕</span>
                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder={t(
                                            'filter.searchPlaceholder',
                                        )}
                                    />
                                </label>
                                <label className="header-status">
                                    <span className="sr-only">
                                        {t('filter.statusLabel')}
                                    </span>
                                    <select
                                        value={status}
                                        onChange={(event) => {
                                            const nextStatus = event.target
                                                .value as
                                                | ApplicationStatus
                                                | ''
                                            setStatus(nextStatus)
                                            navigateToApplications(
                                                search,
                                                nextStatus,
                                            )
                                        }}
                                    >
                                        <option value="">
                                            {t('filter.allStatuses')}
                                        </option>
                                        {STATUSES.map((item) => (
                                            <option key={item} value={item}>
                                                {t(`status.${item}`)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </form>

                            <button
                                className="button button--primary button--small"
                                type="button"
                                onClick={() =>
                                    navigate('/applications?add=true')
                                }
                            >
                                + {t('nav.addApplication')}
                            </button>
                            <ProfileMenu onLogout={logout} />
                        </div>
                    </div>
                </header>

                <div className="statistics-content">
                    <div
                        className="statistics-periods"
                        role="group"
                        aria-label={t('statistics.periodLabel')}
                    >
                        {PERIODS.map((item) => (
                            <button
                                className={period === item ? 'is-active' : ''}
                                type="button"
                                key={item}
                                aria-pressed={period === item}
                                onClick={() => setPeriod(item)}
                            >
                                {t(`statistics.period.${item}`)}
                            </button>
                        ))}
                    </div>

                    {statisticsQuery.isPending && (
                        <section
                            className="statistics-loading"
                            aria-label={t('statistics.loading')}
                        >
                            {Array.from({ length: 5 }, (_, index) => (
                                <span key={index} />
                            ))}
                        </section>
                    )}

                    {statisticsQuery.isError && (
                        <div className="alert alert--error" role="alert">
                            <strong>{t('statistics.loadError')}</strong>
                            <button
                                className="button button--secondary button--small"
                                type="button"
                                onClick={() => statisticsQuery.refetch()}
                            >
                                {t('statistics.retry')}
                            </button>
                        </div>
                    )}

                    {overview && summary && (
                        <>
                            <section
                                className="statistics-kpis"
                                aria-label={t('statistics.summary')}
                            >
                                <SummaryCard
                                    label={t('statistics.total')}
                                    value={summary.totalApplications}
                                    change={summary.totalApplicationsChange}
                                    accent="var(--interview)"
                                    icon="▣"
                                    changeLabel={(change) =>
                                        formatChange(change, t)
                                    }
                                />
                                <SummaryCard
                                    label={t('statistics.active')}
                                    value={summary.activeApplications}
                                    change={summary.activeApplicationsChange}
                                    accent="var(--primary-bright)"
                                    icon="◎"
                                    changeLabel={(change) =>
                                        formatChange(change, t)
                                    }
                                />
                                <SummaryCard
                                    label={t('statistics.interviews')}
                                    value={summary.interviews}
                                    change={summary.interviewsChange}
                                    accent="var(--primary-bright)"
                                    icon="□"
                                    changeLabel={(change) =>
                                        formatChange(change, t)
                                    }
                                />
                                <SummaryCard
                                    label={t('statistics.offers')}
                                    value={summary.offers}
                                    change={summary.offersChange}
                                    accent="var(--warning)"
                                    icon="✓"
                                    changeLabel={(change) =>
                                        formatChange(change, t)
                                    }
                                />
                                <SummaryCard
                                    label={t('statistics.progressRate')}
                                    value={`${numberFormatter.format(summary.progressRate)}%`}
                                    change={summary.progressRateChange}
                                    accent="var(--success)"
                                    icon="↗"
                                    changeLabel={(change) =>
                                        formatChange(change, t)
                                    }
                                />
                            </section>

                            <section className="statistics-main-grid">
                                <article className="statistics-panel statistics-panel--trend">
                                    <div className="statistics-panel__heading">
                                        <div>
                                            <h2>{t('statistics.overTime')}</h2>
                                            <p>
                                                {t(
                                                    `statistics.period.${period}`,
                                                )}
                                            </p>
                                        </div>
                                        <div
                                            className="statistics-chart-toggle"
                                            role="group"
                                            aria-label={t(
                                                'statistics.chartType',
                                            )}
                                        >
                                            <button
                                                className={
                                                    chartMode === 'area'
                                                        ? 'is-active'
                                                        : ''
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setChartMode('area')
                                                }
                                            >
                                                {t('statistics.area')}
                                            </button>
                                            <button
                                                className={
                                                    chartMode === 'bar'
                                                        ? 'is-active'
                                                        : ''
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setChartMode('bar')
                                                }
                                            >
                                                {t('statistics.bar')}
                                            </button>
                                        </div>
                                    </div>
                                    <TrendChart
                                        points={cumulativeTrend}
                                        mode={chartMode}
                                        locale={locale}
                                        emptyLabel={t(
                                            'statistics.noTrendData',
                                        )}
                                        chartLabel={t(
                                            'statistics.overTime',
                                        )}
                                    />
                                </article>

                                <article className="statistics-panel statistics-panel--status">
                                    <div className="statistics-panel__heading">
                                        <div>
                                            <h2>
                                                {t(
                                                    'statistics.statusBreakdown',
                                                )}
                                            </h2>
                                            <p>{t('statistics.liveData')}</p>
                                        </div>
                                    </div>
                                    <div
                                        className="statistics-donut"
                                        style={{
                                            background: donutBackground,
                                        }}
                                        role="img"
                                        aria-label={t(
                                            'statistics.statusBreakdown',
                                        )}
                                    >
                                        <div>
                                            <strong>
                                                {summary.totalApplications}
                                            </strong>
                                            <span>
                                                {t('statistics.totalShort')}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="statistics-legend">
                                        {STATUSES.map((item) => {
                                            const data = statusByName.get(item)

                                            return (
                                                <li key={item}>
                                                    <span
                                                        style={{
                                                            background:
                                                                STATUS_COLORS[
                                                                    item
                                                                ],
                                                        }}
                                                    />
                                                    <p>
                                                        {t(`status.${item}`)}
                                                    </p>
                                                    <strong>
                                                        {data?.count ?? 0}
                                                    </strong>
                                                    <small>
                                                        {numberFormatter.format(
                                                            data?.percentage ??
                                                                0,
                                                        )}
                                                        %
                                                    </small>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </article>
                            </section>

                            <section className="statistics-secondary-grid">
                                <article className="statistics-panel">
                                    <div className="statistics-panel__heading">
                                        <div>
                                            <h2>{t('statistics.pipeline')}</h2>
                                            <p>
                                                {t(
                                                    'statistics.pipelineSubtitle',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="statistics-bars">
                                        {STATUSES.map((item) => {
                                            const data = statusByName.get(item)
                                            const percentage =
                                                data?.percentage ?? 0

                                            return (
                                                <div
                                                    className="statistics-bar-row"
                                                    key={item}
                                                >
                                                    <div>
                                                        <span>
                                                            {t(
                                                                `status.${item}`,
                                                            )}
                                                        </span>
                                                        <strong>
                                                            {data?.count ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div className="statistics-progress">
                                                        <span
                                                            style={{
                                                                width: `${Math.min(percentage, 100)}%`,
                                                                background:
                                                                    STATUS_COLORS[
                                                                        item
                                                                    ],
                                                            }}
                                                        />
                                                    </div>
                                                    <small>
                                                        {numberFormatter.format(
                                                            percentage,
                                                        )}
                                                        %
                                                    </small>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </article>

                                <article className="statistics-panel">
                                    <div className="statistics-panel__heading">
                                        <div>
                                            <h2>{t('statistics.followUps')}</h2>
                                            <p>
                                                {t(
                                                    'statistics.followUpsSubtitle',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="statistics-bars">
                                        {(
                                            [
                                                [
                                                    'completed',
                                                    overview.followUps
                                                        .completed,
                                                    'var(--success)',
                                                ],
                                                [
                                                    'upcoming',
                                                    overview.followUps
                                                        .upcoming,
                                                    'var(--interview)',
                                                ],
                                                [
                                                    'overdue',
                                                    overview.followUps.overdue,
                                                    'var(--danger)',
                                                ],
                                            ] as const
                                        ).map(([name, count, color]) => {
                                            const percentage = totalFollowUps
                                                ? (count / totalFollowUps) * 100
                                                : 0

                                            return (
                                                <div
                                                    className="statistics-bar-row"
                                                    key={name}
                                                >
                                                    <div>
                                                        <span>
                                                            {t(
                                                                `statistics.followUp.${name}`,
                                                            )}
                                                        </span>
                                                        <strong>{count}</strong>
                                                    </div>
                                                    <div className="statistics-progress">
                                                        <span
                                                            style={{
                                                                width: `${percentage}%`,
                                                                background:
                                                                    color,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </article>

                                <article className="statistics-panel statistics-insight">
                                    <span aria-hidden="true">✦</span>
                                    <div>
                                        <p className="panel-kicker">
                                            {t('statistics.insightLabel')}
                                        </p>
                                        <h2>{t('statistics.insightTitle')}</h2>
                                        <p>
                                            {t('statistics.insightBody', {
                                                rate: numberFormatter.format(
                                                    summary.progressRate,
                                                ),
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        className="button button--ghost-purple button--small"
                                        type="button"
                                        onClick={() =>
                                            navigate('/applications')
                                        }
                                    >
                                        {t('statistics.reviewApplications')}
                                    </button>
                                </article>
                            </section>
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}
