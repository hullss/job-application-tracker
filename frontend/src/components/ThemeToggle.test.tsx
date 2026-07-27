import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
    it('switches the theme and persists the choice', async () => {
        document.documentElement.dataset.theme = 'light'

        const user = userEvent.setup()
        render(<ThemeToggle />)

        await user.click(
            screen.getByRole('button', {
                name: 'Switch to dark theme',
            }),
        )

        expect(document.documentElement.dataset.theme).toBe('dark')
        expect(localStorage.getItem('theme')).toBe('dark')
        expect(
            screen.getByRole('button', {
                name: 'Switch to light theme',
            }),
        ).toBeInTheDocument()

        delete document.documentElement.dataset.theme
    })
})
