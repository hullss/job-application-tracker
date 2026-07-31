import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileMenu } from './ProfileMenu'

vi.mock('./SkillsManager', () => ({
    SkillsManager: () => <div>Profile skills</div>,
}))

function tokenFor(email: string) {
    const payload = btoa(JSON.stringify({ sub: email }))

    return `header.${payload}.signature`
}

describe('ProfileMenu', () => {
    it('shows the JWT user and logs out from the menu', async () => {
        localStorage.setItem(
            'accessToken',
            tokenFor('alice@example.com'),
        )
        const onLogout = vi.fn()
        const user = userEvent.setup()

        render(<ProfileMenu onLogout={onLogout} />)

        expect(screen.getByText('alice@example.com')).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: /alice/i }),
        )
        await user.click(
            screen.getByRole('menuitem', { name: 'Log out' }),
        )

        expect(onLogout).toHaveBeenCalledOnce()
    })

    it('falls back safely when the token is malformed', () => {
        localStorage.setItem('accessToken', 'not-a-jwt')

        render(<ProfileMenu onLogout={vi.fn()} />)

        expect(screen.getByText('Signed-in user')).toBeInTheDocument()
        expect(screen.getByText('Account')).toBeInTheDocument()
    })
})
