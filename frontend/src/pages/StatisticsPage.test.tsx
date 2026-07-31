import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
    getStatisticsOverview,
    type StatisticsOverview,
} from '../api/statistics'
import { StatisticsPage } from './StatisticsPage'

vi.mock('../api/statistics', () => ({
    getStatisticsOverview: vi.fn(),
}))

const mockedGetStatistics = vi.mocked(getStatisticsOverview)

const overview: StatisticsOverview = {
    period: 'LAST_30_DAYS',
    rangeStart: '2026-07-01',
    rangeEnd: '2026-07-31',
    summary: {
        totalApplications: 16,
        activeApplications: 8,
        interviews: 5,
        offers: 1,
        progressRate: 37.5,
        totalApplicationsChange: 4,
        activeApplicationsChange: 2,
        interviewsChange: 3,
        offersChange: 1,
        progressRateChange: 2.5,
    },
    statusBreakdown: [
        { status: 'APPLIED', count: 8, percentage: 50 },
        { status: 'INTERVIEW', count: 5, percentage: 31.25 },
        { status: 'OFFER', count: 1, percentage: 6.25 },
        { status: 'REJECTED', count: 2, percentage: 12.5 },
    ],
    applicationsOverTime: [
        { date: '2026-07-01', count: 2 },
        { date: '2026-07-08', count: 4 },
        { date: '2026-07-15', count: 3 },
    ],
    followUps: {
        completed: 9,
        upcoming: 5,
        overdue: 2,
    },
}

function renderStatisticsPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })

    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/statistics']}>
                <Routes>
                    <Route
                        path="/statistics"
                        element={<StatisticsPage />}
                    />
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

describe('StatisticsPage', () => {
    beforeEach(() => {
        mockedGetStatistics.mockReset()
        mockedGetStatistics.mockResolvedValue(overview)
    })

    it('renders summary, status and follow-up statistics', async () => {
        renderStatisticsPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Applications over time',
            }),
        ).toBeInTheDocument()
        expect(screen.getAllByText('16').length).toBeGreaterThan(0)
        expect(screen.getByText('37.5%')).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Status breakdown' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Follow-up overview' }),
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText('2026-07-15: 9'),
        ).toBeInTheDocument()
    })

    it('loads a new overview when the period changes', async () => {
        const user = userEvent.setup()
        renderStatisticsPage()

        await screen.findByText('Applications over time')
        await user.click(
            screen.getByRole('button', { name: 'Last 3 months' }),
        )

        await waitFor(() => {
            expect(mockedGetStatistics).toHaveBeenCalledWith(
                'LAST_3_MONTHS',
            )
        })
    })

    it('opens filtered applications after two search characters', async () => {
        const user = userEvent.setup()
        renderStatisticsPage()

        await screen.findByText('Applications over time')
        await user.type(
            screen.getByPlaceholderText('Search company or position'),
            'Ac',
        )

        expect(
            await screen.findByRole('heading', { name: 'Applications' }),
        ).toBeInTheDocument()
    })
})
