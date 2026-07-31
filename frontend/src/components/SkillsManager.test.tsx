import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    createSkill,
    deleteSkill,
    getSkills,
} from '../api/skills'
import { SkillsManager } from './SkillsManager'

vi.mock('../api/skills', () => ({
    getSkills: vi.fn(),
    createSkill: vi.fn(),
    deleteSkill: vi.fn(),
}))

function renderSkillsManager() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    render(
        <QueryClientProvider client={queryClient}>
            <SkillsManager />
        </QueryClientProvider>,
    )
}

describe('SkillsManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSkills).mockResolvedValue([
            { id: 1, name: 'Java' },
            { id: 2, name: 'PostgreSQL' },
        ])
        vi.mocked(createSkill).mockResolvedValue({
            id: 3,
            name: 'Spring Boot',
        })
        vi.mocked(deleteSkill).mockResolvedValue(undefined)
    })

    it('loads skills and adds a new one', async () => {
        const user = userEvent.setup()

        renderSkillsManager()

        expect(await screen.findByText('Java')).toBeInTheDocument()

        await user.type(
            screen.getByRole('textbox', { name: 'Skill name' }),
            'Spring Boot',
        )
        await user.click(screen.getByRole('button', { name: 'Add' }))

        expect(createSkill).toHaveBeenCalledWith('Spring Boot')
        expect(
            await screen.findByText('Spring Boot'),
        ).toBeInTheDocument()
    })

    it('deletes one of the current user skills', async () => {
        const user = userEvent.setup()

        renderSkillsManager()

        await user.click(
            await screen.findByRole('button', {
                name: 'Remove PostgreSQL',
            }),
        )

        expect(deleteSkill).toHaveBeenCalledWith(2)
        await waitFor(() =>
            expect(
                screen.queryByText('PostgreSQL'),
            ).not.toBeInTheDocument(),
        )
    })
})
