import { useMemo, useState, type FormEvent } from 'react'
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
    completeCalendarEvent,
    createCalendarEvent,
    getCalendarEvents,
    updateCalendarEvent,
    type CalendarEvent,
    type CalendarEventInput,
    type CalendarEventType,
} from '../api/events'
import { getApplications } from '../api/applications'
import { DashboardSidebar } from '../components/DashboardSidebar'
import { ProfileMenu } from '../components/ProfileMenu'
import { Toast, type ToastKind } from '../components/Toast'
import { useLanguage } from '../i18n/language-context'
import type { Language } from '../i18n/translations'

type CalendarView = 'month' | 'week'

type ToastState = {
    message: string
    kind: ToastKind
}

const EVENT_TYPES: CalendarEventType[] = [
    'INTERVIEW',
    'FOLLOW_UP',
    'DEADLINE',
    'OTHER',
]

const LANGUAGE_LOCALES: Record<Language, string> = {
    en: 'en-US',
    uk: 'uk-UA',
    sk: 'sk-SK',
}

function startOfDay(date: Date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    )
}

function startOfWeek(date: Date) {
    const result = startOfDay(date)
    result.setDate(result.getDate() - result.getDay())
    return result
}

function addDays(date: Date, amount: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + amount)
    return result
}

function dateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function toDateTimeLocal(value: Date | string) {
    const date = typeof value === 'string' ? new Date(value) : value
    const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000,
    )

    return local.toISOString().slice(0, 16)
}

function isSameDay(first: Date, second: Date) {
    return dateKey(first) === dateKey(second)
}

function isOverdue(event: CalendarEvent, now: Date) {
    return !event.completedAt && new Date(event.scheduledAt) < now
}

export function CalendarPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { language, t } = useLanguage()
    const locale = LANGUAGE_LOCALES[language]

    const [cursorDate, setCursorDate] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    )
    const [view, setView] = useState<CalendarView>('month')
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<
        CalendarEventType | ''
    >('')
    const [selectedEvent, setSelectedEvent] =
        useState<CalendarEvent | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingEventId, setEditingEventId] = useState<number | null>(
        null,
    )
    const [applicationId, setApplicationId] = useState('')
    const [eventType, setEventType] =
        useState<CalendarEventType>('FOLLOW_UP')
    const [scheduledAt, setScheduledAt] = useState('')
    const [notes, setNotes] = useState('')
    const [toast, setToast] = useState<ToastState | null>(null)

    const monthGridStart = startOfWeek(
        new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1),
    )
    const monthGridEnd = addDays(monthGridStart, 42)
    const weekGridStart = startOfWeek(cursorDate)
    const rangeStart = view === 'month' ? monthGridStart : weekGridStart
    const rangeEnd =
        view === 'month' ? monthGridEnd : addDays(weekGridStart, 7)

    const eventsQuery = useQuery({
        queryKey: [
            'calendar-events',
            rangeStart.toISOString(),
            rangeEnd.toISOString(),
        ],
        queryFn: () =>
            getCalendarEvents(
                rangeStart.toISOString(),
                rangeEnd.toISOString(),
            ),
    })

    const applicationsQuery = useQuery({
        queryKey: ['applications', 'calendar-selector'],
        queryFn: () => getApplications({ page: 0, size: 100 }),
    })

    const saveMutation = useMutation({
        mutationFn: ({
            eventId,
            selectedApplicationId,
            input,
        }: {
            eventId: number | null
            selectedApplicationId: number
            input: CalendarEventInput
        }) =>
            eventId
                ? updateCalendarEvent(eventId, input)
                : createCalendarEvent(selectedApplicationId, input),
        onSuccess: async () => {
            closeEditor()
            setToast({
                message: t('calendar.saved'),
                kind: 'success',
            })
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events'],
            })
        },
        onError: (error) => {
            setToast({
                message:
                    error instanceof Error
                        ? error.message
                        : t('calendar.saveError'),
                kind: 'error',
            })
        },
    })

    const completeMutation = useMutation({
        mutationFn: completeCalendarEvent,
        onSuccess: async () => {
            setSelectedEvent(null)
            setToast({
                message: t('calendar.completed'),
                kind: 'success',
            })
            await queryClient.invalidateQueries({
                queryKey: ['calendar-events'],
            })
        },
        onError: (error) => {
            setToast({
                message:
                    error instanceof Error
                        ? error.message
                        : t('calendar.completeError'),
                kind: 'error',
            })
        },
    })

    const now = new Date()
    const rawEvents = useMemo(
        () => eventsQuery.data ?? [],
        [eventsQuery.data],
    )
    const filteredEvents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return rawEvents.filter((event) => {
            const matchesType =
                !typeFilter || event.type === typeFilter
            const matchesSearch =
                !normalizedSearch ||
                event.company.toLowerCase().includes(normalizedSearch) ||
                event.position.toLowerCase().includes(normalizedSearch)

            return matchesType && matchesSearch
        })
    }, [rawEvents, search, typeFilter])

    const calendarDays = Array.from(
        { length: view === 'month' ? 42 : 7 },
        (_, index) =>
            addDays(
                view === 'month' ? monthGridStart : weekGridStart,
                index,
            ),
    )

    const eventsByDay = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>()

        filteredEvents.forEach((event) => {
            const key = dateKey(new Date(event.scheduledAt))
            const current = grouped.get(key) ?? []
            current.push(event)
            grouped.set(
                key,
                current.sort(
                    (first, second) =>
                        new Date(first.scheduledAt).getTime() -
                        new Date(second.scheduledAt).getTime(),
                ),
            )
        })

        return grouped
    }, [filteredEvents])

    const todayEvents = rawEvents.filter((event) =>
        isSameDay(new Date(event.scheduledAt), now),
    )
    const weekEnd = addDays(startOfDay(now), 7)
    const weekEvents = rawEvents.filter((event) => {
        const scheduled = new Date(event.scheduledAt)
        return scheduled >= startOfDay(now) && scheduled < weekEnd
    })
    const upcomingInterviews = rawEvents.filter(
        (event) =>
            event.type === 'INTERVIEW' &&
            !event.completedAt &&
            new Date(event.scheduledAt) >= now,
    )
    const overdueEvents = rawEvents.filter((event) =>
        isOverdue(event, now),
    )
    const upcomingEvents = [...rawEvents]
        .filter((event) => !event.completedAt)
        .sort(
            (first, second) =>
                new Date(first.scheduledAt).getTime() -
                new Date(second.scheduledAt).getTime(),
        )

    const monthLabel = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
    }).format(cursorDate)
    const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, {
            weekday: 'short',
        }).format(addDays(startOfWeek(new Date(2026, 0, 4)), index)),
    )

    function logout() {
        localStorage.removeItem('accessToken')
        navigate('/login', { replace: true })
    }

    function changePeriod(direction: number) {
        setCursorDate((current) => {
            if (view === 'week') {
                return addDays(current, direction * 7)
            }

            return new Date(
                current.getFullYear(),
                current.getMonth() + direction,
                1,
            )
        })
    }

    function openCreateEditor(date = new Date()) {
        const proposedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            9,
            0,
        )
        setEditingEventId(null)
        setApplicationId('')
        setEventType('FOLLOW_UP')
        setScheduledAt(toDateTimeLocal(proposedDate))
        setNotes('')
        setSelectedEvent(null)
        setIsEditorOpen(true)
    }

    function openEditEditor(event: CalendarEvent) {
        setEditingEventId(event.id)
        setApplicationId(String(event.applicationId))
        setEventType(event.type)
        setScheduledAt(toDateTimeLocal(event.scheduledAt))
        setNotes(event.notes ?? '')
        setSelectedEvent(null)
        setIsEditorOpen(true)
    }

    function closeEditor() {
        setIsEditorOpen(false)
        setEditingEventId(null)
        setApplicationId('')
        setScheduledAt('')
        setNotes('')
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!applicationId || !scheduledAt) {
            return
        }

        saveMutation.mutate({
            eventId: editingEventId,
            selectedApplicationId: Number(applicationId),
            input: {
                type: eventType,
                scheduledAt: new Date(scheduledAt).toISOString(),
                notes: notes.trim() || null,
            },
        })
    }

    return (
        <main className="dashboard-page">
            <DashboardSidebar
                active="calendar"
                onAddApplication={() =>
                    navigate('/applications?add=true')
                }
                onLogout={logout}
            />

            <section className="dashboard-workspace">
                <header className="dashboard-header">
                    <div className="dashboard-header__inner">
                        <div className="dashboard-header__title">
                            <strong>{t('calendar.title')}</strong>
                            <span>{t('calendar.subtitle')}</span>
                        </div>

                        <div className="dashboard-header__actions">
                            <label className="header-search">
                                <span className="sr-only">
                                    {t('filter.searchLabel')}
                                </span>
                                <span aria-hidden="true">⌕</span>
                                <input
                                    aria-label={t('filter.searchLabel')}
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
                                    {t('calendar.filterType')}
                                </span>
                                <select
                                    aria-label={t('calendar.filterType')}
                                    value={typeFilter}
                                    onChange={(event) =>
                                        setTypeFilter(
                                            event.target
                                                .value as CalendarEventType | '',
                                        )
                                    }
                                >
                                    <option value="">
                                        {t('calendar.allEvents')}
                                    </option>
                                    {EVENT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {t(`calendar.type.${type}`)}
                                        </option>
                                    ))}
                                </select>
                            </label>

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

                <div className="calendar-content">
                    <section
                        className="calendar-summary"
                        aria-label={t('calendar.summary')}
                    >
                        <article className="calendar-kpi calendar-kpi--today">
                            <strong>{todayEvents.length}</strong>
                            <span>{t('calendar.today')}</span>
                            <small>{t('calendar.todayHint')}</small>
                        </article>
                        <article className="calendar-kpi calendar-kpi--week">
                            <strong>{weekEvents.length}</strong>
                            <span>{t('calendar.thisWeek')}</span>
                            <small>{t('calendar.thisWeekHint')}</small>
                        </article>
                        <article className="calendar-kpi calendar-kpi--interview">
                            <strong>{upcomingInterviews.length}</strong>
                            <span>{t('calendar.upcomingInterviews')}</span>
                            <small>{t('calendar.interviewsHint')}</small>
                        </article>
                        <article className="calendar-kpi calendar-kpi--overdue">
                            <strong>{overdueEvents.length}</strong>
                            <span>{t('calendar.overdue')}</span>
                            <small>{t('calendar.overdueHint')}</small>
                        </article>
                    </section>

                    <section className="calendar-toolbar">
                        <div className="calendar-navigation">
                            <button
                                className="calendar-icon-button"
                                type="button"
                                aria-label={t('calendar.previous')}
                                onClick={() => changePeriod(-1)}
                            >
                                ‹
                            </button>
                            <strong>{monthLabel}</strong>
                            <button
                                className="calendar-icon-button"
                                type="button"
                                aria-label={t('calendar.next')}
                                onClick={() => changePeriod(1)}
                            >
                                ›
                            </button>
                            <button
                                className="button button--secondary button--small"
                                type="button"
                                onClick={() => setCursorDate(new Date())}
                            >
                                {t('calendar.today')}
                            </button>
                        </div>

                        <div className="calendar-view-toggle">
                            <button
                                className={
                                    view === 'month' ? 'is-active' : ''
                                }
                                type="button"
                                onClick={() => setView('month')}
                            >
                                {t('calendar.month')}
                            </button>
                            <button
                                className={
                                    view === 'week' ? 'is-active' : ''
                                }
                                type="button"
                                onClick={() => setView('week')}
                            >
                                {t('calendar.week')}
                            </button>
                        </div>

                        <div className="calendar-legend">
                            {EVENT_TYPES.map((type) => (
                                <span
                                    className={`calendar-legend__item calendar-legend__item--${type.toLowerCase()}`}
                                    key={type}
                                >
                                    {t(`calendar.type.${type}`)}
                                </span>
                            ))}
                            <span className="calendar-legend__item calendar-legend__item--overdue">
                                {t('calendar.overdueShort')}
                            </span>
                        </div>
                    </section>

                    <div className="calendar-layout">
                        <section
                            className={`calendar-board calendar-board--${view}`}
                        >
                            {weekdayLabels.map((label) => (
                                <div
                                    className="calendar-weekday"
                                    key={label}
                                >
                                    {label}
                                </div>
                            ))}

                            {eventsQuery.isPending ? (
                                <div
                                    className="calendar-board__state"
                                    role="status"
                                >
                                    <span className="spinner" />
                                    <p>{t('calendar.loading')}</p>
                                </div>
                            ) : eventsQuery.error ? (
                                <div
                                    className="calendar-board__state"
                                    role="alert"
                                >
                                    <p>{t('calendar.loadError')}</p>
                                </div>
                            ) : (
                                calendarDays.map((day) => {
                                    const dayEvents =
                                        eventsByDay.get(dateKey(day)) ?? []
                                    const outsideMonth =
                                        view === 'month' &&
                                        day.getMonth() !==
                                            cursorDate.getMonth()

                                    return (
                                        <div
                                            className={`calendar-day ${
                                                outsideMonth
                                                    ? 'calendar-day--outside'
                                                    : ''
                                            } ${
                                                isSameDay(day, now)
                                                    ? 'calendar-day--today'
                                                    : ''
                                            }`}
                                            key={dateKey(day)}
                                        >
                                            <button
                                                className="calendar-day__number"
                                                type="button"
                                                aria-label={`${t(
                                                    'calendar.addEvent',
                                                )}: ${day.toLocaleDateString(
                                                    locale,
                                                )}`}
                                                onClick={() =>
                                                    openCreateEditor(day)
                                                }
                                            >
                                                {day.getDate()}
                                            </button>

                                            <span className="calendar-day__events">
                                                {dayEvents
                                                    .slice(0, 3)
                                                    .map((event) => (
                                                        <button
                                                            className={`calendar-event-chip calendar-event-chip--${event.type.toLowerCase()} ${
                                                                isOverdue(
                                                                    event,
                                                                    now,
                                                                )
                                                                    ? 'calendar-event-chip--overdue'
                                                                    : ''
                                                            } ${
                                                                event.completedAt
                                                                    ? 'calendar-event-chip--completed'
                                                                    : ''
                                                            }`}
                                                            key={event.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEvent(
                                                                    event,
                                                                )
                                                            }}
                                                        >
                                                            <time>
                                                                {new Intl.DateTimeFormat(
                                                                    locale,
                                                                    {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    },
                                                                ).format(
                                                                    new Date(
                                                                        event.scheduledAt,
                                                                    ),
                                                                )}
                                                            </time>
                                                            {event.company}
                                                        </button>
                                                    ))}

                                                {dayEvents.length > 3 && (
                                                    <span className="calendar-day__more">
                                                        +
                                                        {dayEvents.length -
                                                            3}{' '}
                                                        {t(
                                                            'calendar.more',
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                        </section>

                        <aside className="calendar-agenda">
                            <div className="calendar-agenda__heading">
                                <div>
                                    <p className="panel-kicker">
                                        {t('calendar.agenda')}
                                    </p>
                                    <h2>{t('calendar.upcoming')}</h2>
                                </div>
                                <button
                                    className="button button--ghost-purple button--small"
                                    type="button"
                                    onClick={() => openCreateEditor()}
                                >
                                    + {t('calendar.addEvent')}
                                </button>
                            </div>

                            {upcomingEvents.length === 0 ? (
                                <div className="calendar-agenda__empty">
                                    <span aria-hidden="true">◫</span>
                                    <p>{t('calendar.noUpcoming')}</p>
                                </div>
                            ) : (
                                <ul className="calendar-agenda__list">
                                    {upcomingEvents.map((event) => (
                                        <li key={event.id}>
                                            <button
                                                className={`agenda-event agenda-event--${event.type.toLowerCase()} ${
                                                    isOverdue(event, now)
                                                        ? 'agenda-event--overdue'
                                                        : ''
                                                }`}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedEvent(event)
                                                }
                                            >
                                                <span className="agenda-event__copy">
                                                    <strong>
                                                        {event.company}
                                                    </strong>
                                                    <small>
                                                        {event.position}
                                                    </small>
                                                </span>
                                                <span className="agenda-event__date">
                                                    <time>
                                                        {new Intl.DateTimeFormat(
                                                            locale,
                                                            {
                                                                weekday:
                                                                    'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        ).format(
                                                            new Date(
                                                                event.scheduledAt,
                                                            ),
                                                        )}
                                                    </time>
                                                    <strong>
                                                        {new Intl.DateTimeFormat(
                                                            locale,
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        ).format(
                                                            new Date(
                                                                event.scheduledAt,
                                                            ),
                                                        )}
                                                    </strong>
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </aside>
                    </div>
                </div>
            </section>

            {selectedEvent && (
                <div
                    className="calendar-modal-backdrop"
                    role="presentation"
                    onMouseDown={() => setSelectedEvent(null)}
                >
                    <section
                        className="calendar-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="event-details-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="calendar-modal__heading">
                            <div>
                                <p className="panel-kicker">
                                    {t(
                                        `calendar.type.${selectedEvent.type}`,
                                    )}
                                </p>
                                <h2 id="event-details-title">
                                    {selectedEvent.company}
                                </h2>
                                <p>{selectedEvent.position}</p>
                            </div>
                            <button
                                className="calendar-modal__close"
                                type="button"
                                aria-label={t('form.close')}
                                onClick={() => setSelectedEvent(null)}
                            >
                                ×
                            </button>
                        </div>

                        <dl className="event-details">
                            <div>
                                <dt>{t('calendar.dateTime')}</dt>
                                <dd>
                                    {new Intl.DateTimeFormat(locale, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }).format(
                                        new Date(selectedEvent.scheduledAt),
                                    )}
                                </dd>
                            </div>
                            {selectedEvent.notes && (
                                <div>
                                    <dt>{t('form.notes')}</dt>
                                    <dd>{selectedEvent.notes}</dd>
                                </div>
                            )}
                        </dl>

                        <div className="calendar-modal__actions">
                            {!selectedEvent.completedAt && (
                                <button
                                    className="button button--primary"
                                    type="button"
                                    disabled={completeMutation.isPending}
                                    onClick={() =>
                                        completeMutation.mutate(
                                            selectedEvent.id,
                                        )
                                    }
                                >
                                    {t('calendar.markComplete')}
                                </button>
                            )}
                            <button
                                className="button button--secondary"
                                type="button"
                                onClick={() =>
                                    openEditEditor(selectedEvent)
                                }
                            >
                                {t('applications.edit')}
                            </button>
                            <button
                                className="button button--ghost"
                                type="button"
                                onClick={() =>
                                    navigate(
                                        '/applications#applications-list',
                                    )
                                }
                            >
                                {t('calendar.openApplication')}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {isEditorOpen && (
                <div
                    className="calendar-modal-backdrop"
                    role="presentation"
                    onMouseDown={closeEditor}
                >
                    <section
                        className="calendar-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="event-editor-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="calendar-modal__heading">
                            <div>
                                <p className="panel-kicker">
                                    {editingEventId
                                        ? t('calendar.editEvent')
                                        : t('calendar.newEvent')}
                                </p>
                                <h2 id="event-editor-title">
                                    {editingEventId
                                        ? t('calendar.editEvent')
                                        : t('calendar.addEvent')}
                                </h2>
                            </div>
                            <button
                                className="calendar-modal__close"
                                type="button"
                                aria-label={t('form.close')}
                                onClick={closeEditor}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="calendar-event-form"
                            onSubmit={handleSubmit}
                        >
                            <label className="field">
                                <span>{t('calendar.application')}</span>
                                <select
                                    value={applicationId}
                                    onChange={(event) =>
                                        setApplicationId(event.target.value)
                                    }
                                    disabled={editingEventId !== null}
                                    required
                                >
                                    <option value="">
                                        {t(
                                            'calendar.selectApplication',
                                        )}
                                    </option>
                                    {applicationsQuery.data?.content.map(
                                        (application) => (
                                            <option
                                                key={application.id}
                                                value={application.id}
                                            >
                                                {application.company} —{' '}
                                                {application.position}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <div className="form-row">
                                <label className="field">
                                    <span>{t('calendar.eventType')}</span>
                                    <select
                                        value={eventType}
                                        onChange={(event) =>
                                            setEventType(
                                                event.target
                                                    .value as CalendarEventType,
                                            )
                                        }
                                    >
                                        {EVENT_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {t(
                                                    `calendar.type.${type}`,
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="field">
                                    <span>{t('calendar.dateTime')}</span>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(event) =>
                                            setScheduledAt(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </label>
                            </div>

                            <label className="field">
                                <span>{t('form.notes')}</span>
                                <textarea
                                    value={notes}
                                    onChange={(event) =>
                                        setNotes(event.target.value)
                                    }
                                    rows={4}
                                    placeholder={t(
                                        'calendar.notesPlaceholder',
                                    )}
                                />
                            </label>

                            <div className="calendar-modal__actions">
                                <button
                                    className="button button--primary"
                                    type="submit"
                                    disabled={
                                        saveMutation.isPending ||
                                        !applicationId
                                    }
                                >
                                    {saveMutation.isPending
                                        ? t('form.saving')
                                        : t('form.save')}
                                </button>
                                <button
                                    className="button button--secondary"
                                    type="button"
                                    onClick={closeEditor}
                                >
                                    {t('dialog.cancel')}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

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
