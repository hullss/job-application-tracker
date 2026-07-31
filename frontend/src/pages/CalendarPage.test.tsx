import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
    completeCalendarEvent,
    createCalendarEvent,
    getCalendarEvents,
    updateCalendarEvent,
    type CalendarEvent,
} from '../api/events'
import {
    getApplications,
    type ApplicationPage,
} from '../api/applications'
import { CalendarPage } from './CalendarPage'

vi.mock('../api/events', () => ({
    completeCalendarEvent: vi.fn(),
    createCalendarEvent: vi.fn(),
    getCalendarEvents: vi.fn(),
    updateCalendarEvent: vi.fn(),
}))

vi.mock('../api/applications', () => ({
    getApplications: vi.fn(),
}))

const mockedCompleteEvent = vi.mocked(completeCalendarEvent)
const mockedCreateEvent = vi.mocked(createCalendarEvent)
const mockedGetEvents = vi.mocked(getCalendarEvents)
const mockedUpdateEvent = vi.mocked(updateCalendarEvent)
const mockedGetApplications = vi.mocked(getApplications)

function atDayOffset(dayOffset: number, hour = 12) {
    const value = new Date()
    value.setDate(value.getDate() + dayOffset)
    value.setHours(hour, 0, 0, 0)
    return value.toISOString()
}

const applications: ApplicationPage = {
    content: [
        {
            id: 7,
            company: 'Acme',
            position: 'Java Developer',
            jobUrl: null,
            jobDescription: null,
            currentStatus: 'APPLIED',
            appliedDate: '2026-07-26',
            followUpAt: null,
            notes: null,
            createdAt: '2026-07-26T10:00:00Z',
            updatedAt: '2026-07-26T10:00:00Z',
        },
    ],
    page: 0,
    size: 100,
    totalElements: 1,
    totalPages: 1,
}

function createEvents(): CalendarEvent[] {
    return [
        {
            id: 1,
            applicationId: 7,
            company: 'Acme',
            position: 'Java Developer',
            type: 'INTERVIEW',
            scheduledAt: atDayOffset(1),
            completedAt: null,
            notes: 'Technical interview',
        },
        {
            id: 2,
            applicationId: 7,
            company: 'Stripe',
            position: 'Backend Engineer',
            type: 'FOLLOW_UP',
            scheduledAt: atDayOffset(-1),
            completedAt: null,
            notes: null,
        },
    ]
}

function renderCalendarPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/calendar']}>
                <Routes>
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route
                        path="/applications"
                        element={<h1>Applications</h1>}
                    />
                    <Route path="/login" element={<h1>Login</h1>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )
}

describe('CalendarPage', () => {
    beforeEach(() => {
        mockedCompleteEvent.mockReset()
        mockedCreateEvent.mockReset()
        mockedGetEvents.mockReset()
        mockedUpdateEvent.mockReset()
        mockedGetApplications.mockReset()

        mockedGetEvents.mockResolvedValue(createEvents())
        mockedGetApplications.mockResolvedValue(applications)
    })

    it('renders calendar events and summary counters', async () => {
        renderCalendarPage()

        expect(
            (await screen.findAllByText('Stripe')).length,
        ).toBeGreaterThan(0)
        expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)

        const interviewsCard = screen
            .getByText('Upcoming interviews')
            .closest('article')
        const overdueCard = screen
            .getByText('Overdue follow-ups')
            .closest('article')

        expect(interviewsCard).not.toBeNull()
        expect(overdueCard).not.toBeNull()
        expect(
            within(interviewsCard as HTMLElement).getByText('1'),
        ).toBeInTheDocument()
        expect(
            within(overdueCard as HTMLElement).getByText('1'),
        ).toBeInTheDocument()
    })

    it('creates an event for one of the user applications', async () => {
        mockedCreateEvent.mockResolvedValue(createEvents()[0])
        const user = userEvent.setup()
        renderCalendarPage()

        await screen.findAllByText('Stripe')
        await user.click(
            screen.getByRole('button', { name: '+ Add event' }),
        )
        await user.selectOptions(
            screen.getByLabelText('Application'),
            '7',
        )
        await user.selectOptions(
            screen.getByLabelText('Event type'),
            'INTERVIEW',
        )
        await user.type(
            screen.getByLabelText('Private notes'),
            'Recruiter call',
        )
        await user.click(
            screen.getByRole('button', { name: 'Save changes' }),
        )

        await waitFor(() => {
            expect(mockedCreateEvent).toHaveBeenCalledWith(
                7,
                expect.objectContaining({
                    type: 'INTERVIEW',
                    scheduledAt: expect.any(String),
                    notes: 'Recruiter call',
                }),
            )
        })
    })
})
