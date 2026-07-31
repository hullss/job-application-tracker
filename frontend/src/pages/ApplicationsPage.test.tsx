import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
    createApplication,
    deleteApplication,
    getApplications,
    updateApplication,
    type ApplicationPage,
    type JobApplication,
} from '../api/applications'
import {
    analyzeSkillGap,
    type SkillGapAnalysis,
} from '../api/skillGap'
import { ApplicationsPage } from './ApplicationsPage'

vi.mock('../api/applications', () => ({
    createApplication: vi.fn(),
    deleteApplication: vi.fn(),
    getApplications: vi.fn(),
    updateApplication: vi.fn(),
}))

vi.mock('../api/skillGap', () => ({
    analyzeSkillGap: vi.fn(),
}))

const mockedCreateApplication = vi.mocked(createApplication)
const mockedDeleteApplication = vi.mocked(deleteApplication)
const mockedGetApplications = vi.mocked(getApplications)
const mockedUpdateApplication = vi.mocked(updateApplication)
const mockedAnalyzeSkillGap = vi.mocked(analyzeSkillGap)

const application: JobApplication = {
    id: 1,
    company: 'Acme',
    position: 'Java Developer',
    jobUrl: 'https://example.com/jobs/1',
    jobDescription: 'Build Spring Boot services',
    currentStatus: 'APPLIED',
    appliedDate: '2026-07-26',
    followUpAt: null,
    notes: 'Applied through the company website',
    createdAt: '2026-07-26T10:00:00Z',
    updatedAt: '2026-07-26T10:00:00Z',
}

const skillGapAnalysis: SkillGapAnalysis = {
    requirements: {
        requiredSkills: [
            'Java',
            'Spring Boot',
            'PostgreSQL',
            'Docker',
        ],
        niceToHaveSkills: [],
        seniorityLevel: 'NOT_SPECIFIED',
        englishLevel: 'NOT_SPECIFIED',
    },
    match: {
        matchPercentage: 50,
        matchedSkills: ['Java', 'PostgreSQL'],
        missingSkills: ['Spring Boot', 'Docker'],
        matchedNiceToHaveSkills: [],
    },
}

function page(content: JobApplication[] = []): ApplicationPage {
    return {
        content,
        page: 0,
        size: 5,
        totalElements: content.length,
        totalPages: content.length > 0 ? 1 : 0,
    }
}

function renderApplicationsPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    })

    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/applications']}>
                <Routes>
                    <Route
                        path="/applications"
                        element={<ApplicationsPage />}
                    />
                    <Route
                        path="/login"
                        element={<h1>Login page</h1>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )
}

describe('ApplicationsPage', () => {
    beforeEach(() => {
        mockedCreateApplication.mockReset()
        mockedDeleteApplication.mockReset()
        mockedGetApplications.mockReset()
        mockedUpdateApplication.mockReset()
        mockedAnalyzeSkillGap.mockReset()

        mockedGetApplications.mockResolvedValue(page())

        Object.defineProperty(
            HTMLDialogElement.prototype,
            'showModal',
            {
                configurable: true,
                value(this: HTMLDialogElement) {
                    this.open = true
                },
            },
        )
        Object.defineProperty(HTMLDialogElement.prototype, 'close', {
            configurable: true,
            value(this: HTMLDialogElement) {
                this.open = false
            },
        })
    })

    it('loads and renders the current user applications', async () => {
        mockedGetApplications.mockResolvedValue(page([application]))

        renderApplicationsPage()

        expect(
            await screen.findByRole('heading', {
                name: 'Java Developer',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Acme')).toBeInTheDocument()
        expect(screen.getAllByText('Applied').length).toBeGreaterThan(0)
        expect(mockedGetApplications).toHaveBeenCalledWith({
            search: undefined,
            status: undefined,
            page: 0,
            size: 5,
        })
    })

    it('creates an application from the form', async () => {
        mockedCreateApplication.mockResolvedValue(application)

        const user = userEvent.setup()
        renderApplicationsPage()

        await screen.findByText('No applications found')
        await user.click(
            screen.getAllByRole('button', {
                name: 'Add application',
            })[0],
        )
        await user.type(screen.getByLabelText('Company'), '  Acme  ')
        await user.type(
            screen.getByLabelText('Position'),
            '  Java Developer  ',
        )
        await user.click(
            screen.getByRole('button', { name: 'Applied date' }),
        )
        await user.click(screen.getByRole('button', { name: 'Today' }))
        await user.click(screen.getByRole('button', { name: 'Apply' }))
        const today = new Date()
        const selectedDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0'),
        ].join('-')
        const applicationForm = screen.getByRole('form', {
            name: 'Add application',
        })
        await user.click(
            within(applicationForm).getByRole('button', {
                name: 'Add application',
            }),
        )

        await waitFor(() => {
            expect(mockedCreateApplication).toHaveBeenCalledWith(
                {
                    company: 'Acme',
                    position: 'Java Developer',
                    jobUrl: null,
                    jobDescription: null,
                    currentStatus: 'APPLIED',
                    appliedDate: selectedDate,
                    followUpAt: null,
                    notes: null,
                },
                expect.anything(),
            )
        })
        expect(
            await screen.findByText(
                'Java Developer at Acme was added.',
            ),
        ).toBeInTheDocument()
    })

    it('applies search and status filters', async () => {
        const user = userEvent.setup()
        renderApplicationsPage()

        await screen.findByText('No applications found')
        await user.type(
            screen.getByLabelText('Search applications'),
            '  Java  ',
        )
        await user.selectOptions(
            screen.getByLabelText('Filter by status'),
            'INTERVIEW',
        )
        await waitFor(() => {
            expect(mockedGetApplications).toHaveBeenCalledWith({
                search: 'Java',
                status: 'INTERVIEW',
                page: 0,
                size: 5,
            })
        })
    })

    it('updates an existing application', async () => {
        mockedGetApplications.mockResolvedValue(page([application]))
        mockedUpdateApplication.mockResolvedValue({
            ...application,
            company: 'Updated Acme',
            currentStatus: 'INTERVIEW',
        })

        const user = userEvent.setup()
        renderApplicationsPage()

        await screen.findByRole('heading', {
            name: 'Java Developer',
        })
        await user.click(
            screen.getByRole('button', { name: 'Edit' }),
        )

        const companyInput = screen.getByLabelText('Company')
        await user.clear(companyInput)
        await user.type(companyInput, 'Updated Acme')
        await user.selectOptions(
            screen.getByLabelText('Status'),
            'INTERVIEW',
        )
        await user.click(
            screen.getByRole('button', {
                name: 'Save changes',
            }),
        )

        await waitFor(() => {
            expect(mockedUpdateApplication).toHaveBeenCalledWith(
                {
                    id: 1,
                    input: expect.objectContaining({
                        company: 'Updated Acme',
                        position: 'Java Developer',
                        currentStatus: 'INTERVIEW',
                    }),
                },
                expect.anything(),
            )
        })
        expect(
            await screen.findByText('Java Developer was updated.'),
        ).toBeInTheDocument()
    })

    it('deletes an application only after confirmation', async () => {
        mockedGetApplications.mockResolvedValue(page([application]))
        mockedDeleteApplication.mockResolvedValue(undefined)

        const user = userEvent.setup()
        renderApplicationsPage()

        await screen.findByRole('heading', {
            name: 'Java Developer',
        })
        await user.click(
            screen.getByRole('button', { name: 'Delete' }),
        )

        expect(mockedDeleteApplication).not.toHaveBeenCalled()
        expect(
            screen.getByRole('heading', {
                name: 'Delete this application?',
            }),
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', {
                name: 'Delete application',
            }),
        )

        await waitFor(() => {
            expect(mockedDeleteApplication).toHaveBeenCalledWith(
                1,
                expect.anything(),
            )
        })
        expect(
            await screen.findByText(
                'Java Developer at Acme was deleted.',
            ),
        ).toBeInTheDocument()
    })

    it('analyzes an application and displays the skill gap', async () => {
        mockedGetApplications.mockResolvedValue(page([application]))
        mockedAnalyzeSkillGap.mockResolvedValue(skillGapAnalysis)

        const user = userEvent.setup()
        renderApplicationsPage()

        await screen.findByRole('heading', {
            name: 'Java Developer',
        })
        await user.click(
            screen.getByRole('button', { name: 'AI match' }),
        )

        await waitFor(() => {
            expect(mockedAnalyzeSkillGap).toHaveBeenCalledWith(
                application.id,
                expect.anything(),
            )
        })

        expect(await screen.findByText('50%')).toBeInTheDocument()
        expect(screen.getByText('Promising match')).toBeInTheDocument()
        expect(screen.getByText('Spring Boot')).toBeInTheDocument()
        expect(screen.getByText('Docker')).toBeInTheDocument()
    })
})
