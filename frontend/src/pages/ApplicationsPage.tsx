import {useState, type FormEvent} from 'react'
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
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ProfileMenu } from '../components/ProfileMenu'
import { Toast, type ToastKind } from '../components/Toast'

const PAGE_SIZE = 5
const STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: 'Applied',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    REJECTED: 'Rejected',
}

type ToastState = {
    message: string
    kind: ToastKind
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
})

function formatDate(value: string) {
    return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function formatDateTime(value: string) {
    return dateTimeFormatter.format(new Date(value))
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
    const [editingApplication, setEditingApplication] =
        useState<JobApplication | null>(null)
    const [applicationToDelete, setApplicationToDelete] =
        useState<JobApplication | null>(null)
    const [toast, setToast] = useState<ToastState | null>(null)

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] =
        useState<ApplicationStatus | ''>('')
    const [page, setPage] = useState(0)

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

    const createMutation = useMutation({
        mutationFn: createApplication,
        onSuccess: async (savedApplication) => {
            clearForm()
            setToast({
                message: `${savedApplication.position} at ${savedApplication.company} was added.`,
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
                    'Unable to add the application.',
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
                message: `${savedApplication.position} was updated.`,
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
                    'Unable to update the application.',
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
                    ? `${deletedApplication.position} at ${deletedApplication.company} was deleted.`
                    : 'Application was deleted.',
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
                    'Unable to delete the application.',
                ),
                kind: 'error',
            })
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
        setSearch(searchInput.trim())
    }

    function clearFilters() {
        setSearchInput('')
        setSearch('')
        setStatusFilter('')
        setPage(0)
    }

    return (
        <main className="dashboard-page">
            <aside className="dashboard-sidebar">
                <div className="brand">
                    <span className="brand-mark">JT</span>
                    <span>JobTrack</span>
                </div>

                <nav className="sidebar-nav" aria-label="Main navigation">
                    <a
                        className="sidebar-nav__item sidebar-nav__item--active"
                        href="#applications-list"
                    >
                        <span aria-hidden="true">⌂</span>
                        Dashboard
                    </a>
                    <a className="sidebar-nav__item" href="#applications-list">
                        <span aria-hidden="true">▤</span>
                        Applications
                    </a>
                    <a className="sidebar-nav__item" href="#application-form">
                        <span aria-hidden="true">＋</span>
                        Add application
                    </a>
                    <span className="sidebar-nav__item sidebar-nav__item--muted">
                        <span aria-hidden="true">◫</span>
                        Calendar
                    </span>
                    <span className="sidebar-nav__item sidebar-nav__item--muted">
                        <span aria-hidden="true">◒</span>
                        Statistics
                    </span>
                </nav>

                <ProfileMenu onLogout={logout} />
            </aside>

            <section className="dashboard-workspace">
                <header className="dashboard-header">
                    <div className="dashboard-header__inner">
                        <div className="brand brand--mobile">
                            <span className="brand-mark">JT</span>
                            <span>JobTrack</span>
                        </div>

                        <div className="dashboard-header__title">
                            <strong>Dashboard</strong>
                            <span>Track and manage your applications</span>
                        </div>

                        <div className="dashboard-header__actions">
                            <a
                                className="button button--primary button--small"
                                href="#application-form"
                            >
                                + Add application
                            </a>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <section className="page-heading">
                        <div>
                            <p className="eyebrow">Application overview</p>
                            <h1>Your opportunities</h1>
                            <p>
                                Keep your pipeline clear and every next step in
                                sight.
                            </p>
                        </div>

                        <div className="total-pill">
                            <span>Total applications</span>
                            <strong>
                                {applicationsQuery.data?.totalElements ?? 0}
                            </strong>
                        </div>
                    </section>

                    <div className="dashboard-grid">
                    <aside
                        className="panel application-form-panel"
                        id="application-form"
                    >
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    {editingApplication
                                        ? 'Updating opportunity'
                                        : 'New opportunity'}
                                </p>
                                <h2>
                                    {editingApplication
                                        ? 'Edit application'
                                        : 'Add application'}
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
                        >
                            <label className="field">
                                <span>Company</span>
                                <input
                                    value={company}
                                    onChange={(event) =>
                                        setCompany(event.target.value)
                                    }
                                    placeholder="e.g. Spotify"
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Position</span>
                                <input
                                    value={position}
                                    onChange={(event) =>
                                        setPosition(event.target.value)
                                    }
                                    placeholder="e.g. Java Developer"
                                    required
                                />
                            </label>

                            <div className="form-row">
                                <label className="field">
                                    <span>Status</span>
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
                                            Applied
                                        </option>
                                        <option value="INTERVIEW">
                                            Interview
                                        </option>
                                        <option value="OFFER">
                                            Offer
                                        </option>
                                        <option value="REJECTED">
                                            Rejected
                                        </option>
                                    </select>
                                </label>

                                <label className="field">
                                    <span>Applied date</span>
                                    <input
                                        type="date"
                                        value={appliedDate}
                                        onChange={(event) =>
                                            setAppliedDate(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>
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
                                        <strong>More details</strong>
                                        <small>
                                            URL, description, reminder and
                                            notes
                                        </small>
                                    </span>
                                    <span className="optional-details__badge">
                                        Optional
                                    </span>
                                </summary>

                                <div className="optional-details__content">
                                    <label className="field">
                                        <span>Job URL</span>
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
                                        <span>Job description</span>
                                        <textarea
                                            value={jobDescription}
                                            onChange={(event) =>
                                                setJobDescription(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Add the key requirements or a short role summary"
                                            rows={3}
                                        />
                                    </label>

                                    <label className="field">
                                        <span>Follow-up reminder</span>
                                        <input
                                            type="datetime-local"
                                            value={followUpAt}
                                            onChange={(event) =>
                                                setFollowUpAt(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <small className="field-hint">
                                            When would you like to follow up?
                                        </small>
                                    </label>

                                    <label className="field">
                                        <span>Private notes</span>
                                        <textarea
                                            value={notes}
                                            onChange={(event) =>
                                                setNotes(event.target.value)
                                            }
                                            placeholder="Recruiter name, interview notes, next steps..."
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
                                        updateMutation.isPending
                                    }
                                >
                                    {createMutation.isPending ||
                                    updateMutation.isPending
                                        ? 'Saving...'
                                        : editingApplication
                                          ? 'Save changes'
                                          : 'Add application'}
                                </button>

                                {editingApplication && (
                                    <button
                                        className="button button--secondary"
                                        type="button"
                                        onClick={clearForm}
                                    >
                                        Cancel
                                    </button>
                                )}
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
                    </aside>

                    <section
                        className="panel applications-panel"
                        id="applications-list"
                    >
                        <div className="panel-heading panel-heading--list">
                            <div>
                                <p className="panel-kicker">
                                    Your pipeline
                                </p>
                                <h2>Tracked opportunities</h2>
                            </div>
                            <span className="results-count">
                                {applicationsQuery.data?.totalElements ?? 0}{' '}
                                results
                            </span>
                        </div>

                        <form
                            className="filter-bar"
                            onSubmit={handleFilterSubmit}
                        >
                            <label className="field field--search">
                                <span className="sr-only">
                                    Search applications
                                </span>
                                <input
                                    value={searchInput}
                                    onChange={(event) =>
                                        setSearchInput(event.target.value)
                                    }
                                    placeholder="Search company or position"
                                />
                            </label>

                            <label className="field field--filter">
                                <span className="sr-only">
                                    Filter by status
                                </span>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        setStatusFilter(
                                            event.target
                                                .value as ApplicationStatus | '',
                                        )
                                        setPage(0)
                                    }}
                                >
                                    <option value="">All statuses</option>
                                    <option value="APPLIED">Applied</option>
                                    <option value="INTERVIEW">
                                        Interview
                                    </option>
                                    <option value="OFFER">Offer</option>
                                    <option value="REJECTED">
                                        Rejected
                                    </option>
                                </select>
                            </label>

                            <button
                                className="button button--primary"
                                type="submit"
                            >
                                Search
                            </button>

                            <button
                                className="button button--ghost"
                                type="button"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        </form>

                        {applicationsQuery.isPending && (
                            <div className="state-card" role="status">
                                <span
                                    className="spinner"
                                    aria-hidden="true"
                                />
                                <p>Loading applications...</p>
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
                                <h3>No applications found</h3>
                                <p>
                                    Add your first opportunity or adjust the
                                    current filters.
                                </p>
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
                                                            {
                                                                STATUS_LABELS[
                                                                    application
                                                                        .currentStatus
                                                                ]
                                                            }
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
                                                                        Note
                                                                    </span>
                                                                    {
                                                                        application.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="application-card__footer">
                                                        <div className="application-meta">
                                                            <p className="application-date">
                                                                <span>
                                                                    Applied
                                                                </span>
                                                                <time
                                                                    dateTime={
                                                                        application.appliedDate
                                                                    }
                                                                >
                                                                    {formatDate(
                                                                        application.appliedDate,
                                                                    )}
                                                                </time>
                                                            </p>

                                                            {application.followUpAt && (
                                                                <p className="application-date application-date--follow-up">
                                                                    <span>
                                                                        Follow
                                                                        up
                                                                    </span>
                                                                    <time
                                                                        dateTime={
                                                                            application.followUpAt
                                                                        }
                                                                    >
                                                                        {formatDateTime(
                                                                            application.followUpAt,
                                                                        )}
                                                                    </time>
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="card-actions">
                                                            {application.jobUrl && (
                                                                <a
                                                                    className="button button--small button--link"
                                                                    href={
                                                                        application.jobUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    View job
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
                                                                Edit
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
                                                                Delete
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
                                    aria-label="Applications pagination"
                                >
                                    <p>
                                        Showing page{' '}
                                        <strong>
                                            {applicationsQuery.data.page + 1}
                                        </strong>{' '}
                                        of{' '}
                                        <strong>
                                            {Math.max(
                                                applicationsQuery.data
                                                    .totalPages,
                                                1,
                                            )}
                                        </strong>
                                    </p>

                                    <div className="pagination__actions">
                                        <button
                                            className="button button--small button--secondary"
                                            type="button"
                                            disabled={page === 0}
                                            onClick={() =>
                                                setPage(
                                                    (currentPage) =>
                                                        currentPage - 1,
                                                )
                                            }
                                        >
                                            Previous
                                        </button>
                                        <button
                                            className="button button--small button--secondary"
                                            type="button"
                                            disabled={
                                                page + 1 >=
                                                applicationsQuery.data
                                                    .totalPages
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (currentPage) =>
                                                        currentPage + 1,
                                                )
                                            }
                                        >
                                            Next
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
                title="Delete this application?"
                description={
                    applicationToDelete
                        ? `${applicationToDelete.position} at ${applicationToDelete.company} will be permanently removed.`
                        : ''
                }
                confirmLabel="Delete application"
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
