import {useEffect, useState, type FormEvent} from 'react'
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import {useNavigate} from 'react-router'
import {
    createApplication,
    deleteApplication,
    getApplications,
    updateApplication,
    type ApplicationStatus,
    type JobApplication,
} from '../api/applications'
import {
    analyzeSkillGap,
    type SkillGapAnalysis,
} from '../api/skillGap'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DateTimePicker } from '../components/DateTimePicker'
import { DashboardSidebar } from '../components/DashboardSidebar'
import { ProfileMenu } from '../components/ProfileMenu'
import { SkillGapResult } from '../components/SkillGapResult'
import { Toast, type ToastKind } from '../components/Toast'
import { useLanguage } from '../i18n/language-context'
import type { Language } from '../i18n/translations'

const PAGE_SIZE = 5
const APPLICATION_STATUSES: ApplicationStatus[] = [
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

type ToastState = {
    message: string
    kind: ToastKind
}

function formatDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`))
}

function formatDateTime(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function toDateTimeLocal(value: string | null) {
    if (!value) {
        return ''
    }

    const date = new Date(value)
    const localTime = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
    )

    return localTime.toISOString().slice(0, 16)
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

export function ApplicationsPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { language, t } = useLanguage()
    const locale = LANGUAGE_LOCALES[language]

    const [company, setCompany] = useState('')
    const [position, setPosition] = useState('')
    const [jobUrl, setJobUrl] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [currentStatus, setCurrentStatus] =
        useState<ApplicationStatus>('APPLIED')
    const [appliedDate, setAppliedDate] = useState('')
    const [followUpAt, setFollowUpAt] = useState('')
    const [notes, setNotes] = useState('')
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(
        () =>
            new URLSearchParams(window.location.search).get('add') ===
            'true',
    )
    const [editingApplication, setEditingApplication] =
        useState<JobApplication | null>(null)
    const [applicationToDelete, setApplicationToDelete] =
        useState<JobApplication | null>(null)
    const [toast, setToast] = useState<ToastState | null>(null)
    const [skillGapResults, setSkillGapResults] = useState<
        Record<number, SkillGapAnalysis>
    >({})
    const [skillGapErrors, setSkillGapErrors] = useState<
        Record<number, string>
    >({})

    const initialSearch = new URLSearchParams(window.location.search)
        .get('search')
        ?.trim() ?? ''
    const initialStatusValue = new URLSearchParams(
        window.location.search,
    ).get('status')
    const initialStatus = APPLICATION_STATUSES.includes(
        initialStatusValue as ApplicationStatus,
    )
        ? (initialStatusValue as ApplicationStatus)
        : ''
    const [searchInput, setSearchInput] = useState(initialSearch)
    const [search, setSearch] = useState(initialSearch)
    const [statusFilter, setStatusFilter] =
        useState<ApplicationStatus | ''>(initialStatus)
    const [page, setPage] = useState(0)

    useEffect(() => {
        const normalizedSearch = searchInput.trim()
        const nextSearch =
            normalizedSearch.length >= 2 ? normalizedSearch : ''
        const timeoutId = window.setTimeout(() => {
            setPage(0)
            setSearch(nextSearch)
        }, 300)

        return () => window.clearTimeout(timeoutId)
    }, [searchInput])

    const applicationsQuery = useQuery({
        queryKey: ['applications', search, statusFilter, page],
        queryFn: () =>
            getApplications({
                search: search || undefined,
                status: statusFilter || undefined,
                page,
                size: PAGE_SIZE,
            }),
    })
    const summaryQuery = useQuery({
        queryKey: ['applications', 'summary'],
        queryFn: async () => {
            const [total, ...statusPages] = await Promise.all([
                getApplications({ page: 0, size: 1 }),
                ...APPLICATION_STATUSES.map((status) =>
                    getApplications({ status, page: 0, size: 1 }),
                ),
            ])

            return {
                total: total.totalElements,
                ...Object.fromEntries(
                    APPLICATION_STATUSES.map((status, index) => [
                        status,
                        statusPages[index].totalElements,
                    ]),
                ),
            } as Record<ApplicationStatus | 'total', number>
        },
    })

    const createMutation = useMutation({
        mutationFn: createApplication,
        onSuccess: async (savedApplication) => {
            clearForm()
            setToast({
                message: t('toast.added', {
                    position: savedApplication.position,
                    company: savedApplication.company,
                }),
                kind: 'success',
            })

            await queryClient.invalidateQueries({
                queryKey: ['applications'],
            })
        },
        onError: (error) => {
            setToast({
                message: getErrorMessage(
                    error,
                    t('error.add'),
                ),
                kind: 'error',
            })
        },
    })
    const updateMutation = useMutation({
        mutationFn: updateApplication,
        onSuccess: async (savedApplication) => {
            clearForm()
            setToast({
                message: t('toast.updated', {
                    position: savedApplication.position,
                }),
                kind: 'success',
            })

            await queryClient.invalidateQueries({
                queryKey: ['applications'],
            })
        },
        onError: (error) => {
            setToast({
                message: getErrorMessage(
                    error,
                    t('error.update'),
                ),
                kind: 'error',
            })
        },
    })
    const deleteMutation = useMutation({
        mutationFn: deleteApplication,
        onSuccess: async () => {
            const deletedApplication = applicationToDelete

            setApplicationToDelete(null)
            setToast({
                message: deletedApplication
                    ? t('toast.deleted', {
                          position: deletedApplication.position,
                          company: deletedApplication.company,
                      })
                    : t('toast.deletedFallback'),
                kind: 'success',
            })

            await queryClient.invalidateQueries({
                queryKey: ['applications'],
            })
        },
        onError: (error) => {
            setToast({
                message: getErrorMessage(
                    error,
                    t('error.delete'),
                ),
                kind: 'error',
            })
        },
    })
    const skillGapMutation = useMutation({
        mutationFn: analyzeSkillGap,
        onMutate: (applicationId) => {
            setSkillGapErrors((current) => ({
                ...current,
                [applicationId]: '',
            }))
        },
        onSuccess: (analysis, applicationId) => {
            setSkillGapResults((current) => ({
                ...current,
                [applicationId]: analysis,
            }))
        },
        onError: (error, applicationId) => {
            setSkillGapErrors((current) => ({
                ...current,
                [applicationId]: getErrorMessage(
                    error,
                    t('ai.error'),
                ),
            }))
        },
    })

    function clearForm() {
        setCompany('')
        setPosition('')
        setJobUrl('')
        setJobDescription('')
        setCurrentStatus('APPLIED')
        setAppliedDate('')
        setFollowUpAt('')
        setNotes('')
        setDetailsOpen(false)
        setEditingApplication(null)
        setIsFormOpen(false)
    }

    function openCreateForm() {
        clearForm()
        setIsFormOpen(true)

        requestAnimationFrame(() => {
            document
                .getElementById('application-form')
                ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
        })
    }

    function startEditing(application: JobApplication) {
        setCompany(application.company)
        setPosition(application.position)
        setJobUrl(application.jobUrl ?? '')
        setJobDescription(application.jobDescription ?? '')
        setCurrentStatus(application.currentStatus)
        setAppliedDate(application.appliedDate)
        setFollowUpAt(toDateTimeLocal(application.followUpAt))
        setNotes(application.notes ?? '')
        setDetailsOpen(
            Boolean(
                application.jobUrl ||
                    application.jobDescription ||
                    application.followUpAt ||
                    application.notes,
            ),
        )
        setEditingApplication(application)
        setIsFormOpen(true)

        requestAnimationFrame(() => {
            document
                .getElementById('application-form')
                ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
        })
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const input = {
            company: company.trim(),
            position: position.trim(),
            jobUrl: jobUrl.trim() || null,
            jobDescription: jobDescription.trim() || null,
            currentStatus,
            appliedDate,
            followUpAt: followUpAt
                ? new Date(followUpAt).toISOString()
                : null,
            notes: notes.trim() || null,
        }

        if (editingApplication) {
            updateMutation.mutate({
                id: editingApplication.id,
                input,
            })

            return
        }

        createMutation.mutate(input)
    }

    function logout() {
        localStorage.removeItem('accessToken')
        navigate('/login', {replace: true})
    }

    function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setPage(0)
        const normalizedSearch = searchInput.trim()
        setSearch(
            normalizedSearch.length >= 2 ? normalizedSearch : '',
        )
    }

    function clearFilters() {
        setSearchInput('')
        setSearch('')
        setStatusFilter('')
        setPage(0)
    }

    const totalPages = applicationsQuery.data?.totalPages ?? 0
    const firstVisiblePage = Math.max(
        0,
        Math.min(page - 2, Math.max(totalPages - 5, 0)),
    )
    const visiblePages = Array.from(
        { length: Math.min(totalPages, 5) },
        (_, index) => firstVisiblePage + index,
    )

    return (
        <main className="dashboard-page">
            <DashboardSidebar
                active="dashboard"
                onAddApplication={openCreateForm}
                onLogout={logout}
            />

            <section className="dashboard-workspace">
                <header className="dashboard-header">
                    <div className="dashboard-header__inner">
                        <div className="brand brand--mobile">
                            <span className="brand-mark">JT</span>
                            <span>JobTrack</span>
                        </div>

                        <div className="dashboard-header__title">
                            <strong>{t('nav.dashboard')}</strong>
                            <span>{t('dashboard.subtitle')}</span>
                        </div>

                        <div className="dashboard-header__actions">
                            <form
                                className="header-filter"
                                onSubmit={handleFilterSubmit}
                            >
                                <label className="header-search">
                                    <span className="sr-only">
                                        {t('filter.searchLabel')}
                                    </span>
                                    <span aria-hidden="true">⌕</span>
                                    <input
                                        aria-label={t('filter.searchLabel')}
                                        value={searchInput}
                                        onChange={(event) =>
                                            setSearchInput(event.target.value)
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
                                        aria-label={t('filter.statusLabel')}
                                        value={statusFilter}
                                        onChange={(event) => {
                                            setStatusFilter(
                                                event.target
                                                    .value as ApplicationStatus | '',
                                            )
                                            setPage(0)
                                        }}
                                    >
                                        <option value="">
                                            {t('filter.allStatuses')}
                                        </option>
                                        {APPLICATION_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {t(`status.${status}`)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                            </form>

                            {(search || statusFilter) && (
                                <button
                                    className="button button--ghost button--small"
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    {t('filter.clear')}
                                </button>
                            )}

                            <button
                                className="button button--primary button--small"
                                type="button"
                                onClick={openCreateForm}
                            >
                                + {t('nav.addApplication')}
                            </button>

                            <ProfileMenu onLogout={logout} />
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <section className="dashboard-summary">
                        <p className="eyebrow">
                            {t('dashboard.opportunities')}
                        </p>

                        <div className="summary-cards">
                            <article className="summary-card summary-card--total">
                                <strong>
                                    {summaryQuery.data?.total ?? 0}
                                </strong>
                                <span>{t('dashboard.total')}</span>
                            </article>

                            {APPLICATION_STATUSES.map((status) => (
                                <article
                                    className={`summary-card summary-card--${status.toLowerCase()}`}
                                    key={status}
                                >
                                    <strong>
                                        {summaryQuery.data?.[status] ?? 0}
                                    </strong>
                                    <span>{t(`status.${status}`)}</span>
                                </article>
                            ))}
                        </div>
                    </section>

                    <div className="dashboard-grid">
                    <aside
                        className="panel application-form-panel"
                        id="application-form"
                    >
                        {!isFormOpen ? (
                            <div className="application-form-prompt">
                                <span
                                    className="application-form-prompt__icon"
                                    aria-hidden="true"
                                >
                                    +
                                </span>
                                <div>
                                    <h2>{t('dashboard.logApplication')}</h2>
                                    <p>{t('dashboard.logApplicationHint')}</p>
                                </div>
                                <button
                                    className="button button--primary"
                                    type="button"
                                    onClick={openCreateForm}
                                >
                                    + {t('nav.addApplication')}
                                </button>
                            </div>
                        ) : (
                            <>
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    {editingApplication
                                        ? t('form.updatingOpportunity')
                                        : t('form.newOpportunity')}
                                </p>
                                <h2>
                                    {editingApplication
                                        ? t('form.editTitle')
                                        : t('form.addTitle')}
                                </h2>
                            </div>
                            <span
                                className="panel-heading__symbol"
                                aria-hidden="true"
                            >
                                {editingApplication ? '✎' : '+'}
                            </span>
                        </div>

                        <form
                            className="application-form"
                            onSubmit={handleSubmit}
                            aria-label={
                                editingApplication
                                    ? t('form.editTitle')
                                    : t('form.addTitle')
                            }
                        >
                            <label className="field">
                                <span>{t('form.company')}</span>
                                <input
                                    value={company}
                                    onChange={(event) =>
                                        setCompany(event.target.value)
                                    }
                                    placeholder={t(
                                        'form.companyPlaceholder',
                                    )}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>{t('form.position')}</span>
                                <input
                                    value={position}
                                    onChange={(event) =>
                                        setPosition(event.target.value)
                                    }
                                    placeholder={t(
                                        'form.positionPlaceholder',
                                    )}
                                    required
                                />
                            </label>

                            <div className="form-row">
                                <label className="field">
                                    <span>{t('form.status')}</span>
                                    <select
                                        value={currentStatus}
                                        onChange={(event) =>
                                            setCurrentStatus(
                                                event.target
                                                    .value as ApplicationStatus,
                                            )
                                        }
                                    >
                                        <option value="APPLIED">
                                            {t('status.APPLIED')}
                                        </option>
                                        <option value="INTERVIEW">
                                            {t('status.INTERVIEW')}
                                        </option>
                                        <option value="OFFER">
                                            {t('status.OFFER')}
                                        </option>
                                        <option value="REJECTED">
                                            {t('status.REJECTED')}
                                        </option>
                                    </select>
                                </label>

                                <div className="field">
                                    <span>{t('form.appliedDate')}</span>
                                    <DateTimePicker
                                        mode="date"
                                        value={appliedDate}
                                        onChange={setAppliedDate}
                                        ariaLabel={t('form.appliedDate')}
                                        placeholder={t(
                                            'picker.selectDate',
                                        )}
                                        required
                                    />
                                </div>
                            </div>

                            <details
                                className="optional-details"
                                open={detailsOpen}
                                onToggle={(event) =>
                                    setDetailsOpen(event.currentTarget.open)
                                }
                            >
                                <summary>
                                    <span>
                                        <strong>
                                            {t('form.moreDetails')}
                                        </strong>
                                        <small>
                                            {t('form.moreDetailsHint')}
                                        </small>
                                    </span>
                                    <span className="optional-details__badge">
                                        {t('form.optional')}
                                    </span>
                                </summary>

                                <div className="optional-details__content">
                                    <label className="field">
                                        <span>{t('form.jobUrl')}</span>
                                        <input
                                            type="url"
                                            value={jobUrl}
                                            onChange={(event) =>
                                                setJobUrl(event.target.value)
                                            }
                                            placeholder="https://company.com/jobs/123"
                                        />
                                    </label>

                                    <label className="field">
                                        <span>
                                            {t('form.jobDescription')}
                                        </span>
                                        <textarea
                                            value={jobDescription}
                                            onChange={(event) =>
                                                setJobDescription(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'form.jobDescriptionPlaceholder',
                                            )}
                                            rows={3}
                                        />
                                    </label>

                                    <div className="field">
                                        <span>{t('form.followUp')}</span>
                                        <DateTimePicker
                                            value={followUpAt}
                                            onChange={setFollowUpAt}
                                            ariaLabel={t('form.followUp')}
                                            placeholder={t(
                                                'picker.selectDateTime',
                                            )}
                                        />
                                        <small className="field-hint">
                                            {t('form.followUpHint')}
                                        </small>
                                    </div>

                                    <label className="field">
                                        <span>{t('form.notes')}</span>
                                        <textarea
                                            value={notes}
                                            onChange={(event) =>
                                                setNotes(event.target.value)
                                            }
                                            placeholder={t(
                                                'form.notesPlaceholder',
                                            )}
                                            rows={3}
                                        />
                                    </label>
                                </div>
                            </details>

                            <div className="form-actions">
                                <button
                                    className="button button--primary"
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        updateMutation.isPending ||
                                        !appliedDate
                                    }
                                >
                                    {createMutation.isPending ||
                                    updateMutation.isPending
                                        ? t('form.saving')
                                        : editingApplication
                                          ? t('form.save')
                                          : t('form.addTitle')}
                                </button>

                                <button
                                    className="button button--secondary"
                                    type="button"
                                    onClick={clearForm}
                                >
                                    {editingApplication
                                        ? t('form.cancel')
                                        : t('form.close')}
                                </button>
                            </div>

                            {createMutation.error && (
                                <p
                                    className="alert alert--error"
                                    role="alert"
                                >
                                    {createMutation.error.message}
                                </p>
                            )}

                            {updateMutation.error && (
                                <p
                                    className="alert alert--error"
                                    role="alert"
                                >
                                    {updateMutation.error.message}
                                </p>
                            )}
                        </form>
                            </>
                        )}
                    </aside>

                    <section
                        className="panel applications-panel"
                        id="applications-list"
                    >
                        <div className="panel-heading panel-heading--list">
                            <div>
                                <p className="panel-kicker">
                                    {t('filter.pipeline')}
                                </p>
                                <h2>{t('filter.tracked')}</h2>
                            </div>
                            <span className="results-count">
                                {t('filter.results', {
                                    count:
                                        applicationsQuery.data
                                            ?.totalElements ?? 0,
                                })}
                            </span>
                        </div>

                        {applicationsQuery.isPending && (
                            <div className="state-card" role="status">
                                <span
                                    className="spinner"
                                    aria-hidden="true"
                                />
                                <p>{t('applications.loading')}</p>
                                <div className="loading-lines" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        )}

                        {applicationsQuery.error && (
                            <p
                                className="alert alert--error"
                                role="alert"
                            >
                                {applicationsQuery.error.message}
                            </p>
                        )}

                        {applicationsQuery.data?.content.length === 0 && (
                            <div className="empty-state">
                                <span
                                    className="empty-state__icon"
                                    aria-hidden="true"
                                >
                                    ◎
                                </span>
                                <h3>{t('applications.empty')}</h3>
                                <p>{t('applications.emptyHint')}</p>
                                <button
                                    className="button button--ghost-purple button--small"
                                    type="button"
                                    onClick={openCreateForm}
                                >
                                    + {t('nav.addApplication')}
                                </button>
                            </div>
                        )}

                        {applicationsQuery.data &&
                            applicationsQuery.data.content.length > 0 && (
                                <ul className="application-list">
                                    {applicationsQuery.data.content.map(
                                        (application) => (
                                            <li
                                                className="application-card"
                                                key={application.id}
                                            >
                                                <div className="company-mark">
                                                    {application.company
                                                        .slice(0, 1)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="application-card__body">
                                                    <div className="application-card__top">
                                                        <div>
                                                            <h3>
                                                                {
                                                                    application.position
                                                                }
                                                            </h3>
                                                            <p>
                                                                {
                                                                    application.company
                                                                }
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`status-badge status-badge--${application.currentStatus.toLowerCase()}`}
                                                        >
                                                            {t(
                                                                `status.${application.currentStatus}`,
                                                            )}
                                                        </span>
                                                    </div>

                                                    {(application.jobDescription ||
                                                        application.notes) && (
                                                        <div className="application-card__details">
                                                            {application.jobDescription && (
                                                                <p className="application-summary">
                                                                    {
                                                                        application.jobDescription
                                                                    }
                                                                </p>
                                                            )}

                                                            {application.notes && (
                                                                <p className="application-note">
                                                                    <span>
                                                                        {t(
                                                                            'applications.note',
                                                                        )}
                                                                    </span>
                                                                    {
                                                                        application.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {skillGapErrors[
                                                        application.id
                                                    ] && (
                                                        <p
                                                            className="skill-gap-error"
                                                            role="alert"
                                                        >
                                                            {
                                                                skillGapErrors[
                                                                    application
                                                                        .id
                                                                ]
                                                            }
                                                        </p>
                                                    )}

                                                    {skillGapResults[
                                                        application.id
                                                    ] && (
                                                        <SkillGapResult
                                                            analysis={
                                                                skillGapResults[
                                                                    application
                                                                        .id
                                                                ]
                                                            }
                                                        />
                                                    )}

                                                    <div className="application-card__footer">
                                                        <div className="application-meta">
                                                            <p className="application-date">
                                                                <span>
                                                                    {t(
                                                                        'applications.applied',
                                                                    )}
                                                                </span>
                                                                <time
                                                                    dateTime={
                                                                        application.appliedDate
                                                                    }
                                                                >
                                                                    {formatDate(
                                                                        application.appliedDate,
                                                                        locale,
                                                                    )}
                                                                </time>
                                                            </p>

                                                            {application.followUpAt && (
                                                                <p className="application-date application-date--follow-up">
                                                                    <span>
                                                                        {t(
                                                                            'applications.followUp',
                                                                        )}
                                                                    </span>
                                                                    <time
                                                                        dateTime={
                                                                            application.followUpAt
                                                                        }
                                                                    >
                                                                        {formatDateTime(
                                                                            application.followUpAt,
                                                                            locale,
                                                                        )}
                                                                    </time>
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="card-actions">
                                                            <button
                                                                className="button button--small button--ai"
                                                                type="button"
                                                                title={
                                                                    application.jobDescription?.trim()
                                                                        ? t(
                                                                              'ai.titleReady',
                                                                          )
                                                                        : t(
                                                                              'ai.titleMissing',
                                                                          )
                                                                }
                                                                disabled={
                                                                    !application.jobDescription?.trim() ||
                                                                    skillGapMutation.isPending
                                                                }
                                                                onClick={() =>
                                                                    skillGapMutation.mutate(
                                                                        application.id,
                                                                    )
                                                                }
                                                            >
                                                                {skillGapMutation.isPending &&
                                                                skillGapMutation.variables ===
                                                                    application.id
                                                                    ? t(
                                                                          'ai.analyzing',
                                                                      )
                                                                    : skillGapResults[
                                                                            application
                                                                                .id
                                                                        ]
                                                                      ? t(
                                                                            'ai.again',
                                                                        )
                                                                      : t(
                                                                            'ai.button',
                                                                        )}
                                                            </button>

                                                            {application.jobUrl && (
                                                                <a
                                                                    className="button button--small button--link"
                                                                    href={
                                                                        application.jobUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    {t(
                                                                        'applications.viewJob',
                                                                    )}
                                                                </a>
                                                            )}

                                                            <button
                                                                className="button button--small button--secondary"
                                                                type="button"
                                                                onClick={() =>
                                                                    startEditing(
                                                                        application,
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'applications.edit',
                                                                )}
                                                            </button>
                                                            <button
                                                                className="button button--small button--danger"
                                                                type="button"
                                                                disabled={
                                                                    deleteMutation.isPending
                                                                }
                                                                onClick={() =>
                                                                    setApplicationToDelete(
                                                                        application,
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'applications.delete',
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}

                        {applicationsQuery.data &&
                            applicationsQuery.data.totalElements > 0 && (
                                <nav
                                    className="pagination"
                                    aria-label={t(
                                        'applications.pagination',
                                    )}
                                >
                                    <p className="pagination__summary">
                                        {t('applications.page', {
                                            page:
                                                applicationsQuery.data
                                                    .page + 1,
                                            total: Math.max(
                                                applicationsQuery.data
                                                    .totalPages,
                                                1,
                                            ),
                                        })}
                                    </p>

                                    <div className="pagination__actions">
                                        <button
                                            className="pagination__button"
                                            type="button"
                                            disabled={page === 0}
                                            aria-label={t(
                                                'applications.previous',
                                            )}
                                            onClick={() =>
                                                setPage(
                                                    (currentPage) =>
                                                        currentPage - 1,
                                                )
                                            }
                                        >
                                            ‹
                                        </button>

                                        {visiblePages.map((pageNumber) => (
                                            <button
                                                className={`pagination__button ${
                                                    pageNumber === page
                                                        ? 'pagination__button--active'
                                                        : ''
                                                }`}
                                                type="button"
                                                key={pageNumber}
                                                aria-current={
                                                    pageNumber === page
                                                        ? 'page'
                                                        : undefined
                                                }
                                                onClick={() =>
                                                    setPage(pageNumber)
                                                }
                                            >
                                                {pageNumber + 1}
                                            </button>
                                        ))}

                                        <button
                                            className="pagination__button"
                                            type="button"
                                            disabled={
                                                page + 1 >=
                                                applicationsQuery.data
                                                    .totalPages
                                            }
                                            aria-label={t(
                                                'applications.next',
                                            )}
                                            onClick={() =>
                                                setPage(
                                                    (currentPage) =>
                                                        currentPage + 1,
                                                )
                                            }
                                        >
                                            ›
                                        </button>
                                    </div>
                                </nav>
                            )}

                        {deleteMutation.error && (
                            <p
                                className="alert alert--error"
                                role="alert"
                            >
                                {deleteMutation.error.message}
                            </p>
                        )}
                    </section>
                </div>
                </div>
            </section>

            <ConfirmDialog
                open={applicationToDelete !== null}
                title={t('dialog.deleteTitle')}
                description={
                    applicationToDelete
                        ? t('dialog.deleteDescription', {
                              position:
                                  applicationToDelete.position,
                              company:
                                  applicationToDelete.company,
                          })
                        : ''
                }
                confirmLabel={t('dialog.deleteConfirm')}
                isPending={deleteMutation.isPending}
                onCancel={() => setApplicationToDelete(null)}
                onConfirm={() => {
                    if (applicationToDelete) {
                        deleteMutation.mutate(applicationToDelete.id)
                    }
                }}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    kind={toast.kind}
                    onDismiss={() => setToast(null)}
                />
            )}
        </main>
    )
}
