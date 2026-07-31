import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../i18n/LanguageContext'
import { LanguageSelector } from './LanguageSelector'
import { ThemeToggle } from './ThemeToggle'

describe('LanguageSelector', () => {
    it('switches the interface language and persists it', async () => {
        localStorage.setItem('language', 'en')
        document.documentElement.dataset.theme = 'light'

        const user = userEvent.setup()

        render(
            <LanguageProvider>
                <LanguageSelector />
                <ThemeToggle />
            </LanguageProvider>,
        )

        await user.selectOptions(
            screen.getByRole('combobox', {
                name: 'Language',
            }),
            'uk',
        )

        expect(localStorage.getItem('language')).toBe('uk')
        expect(document.documentElement.lang).toBe('uk')
        expect(
            screen.getByRole('button', {
                name: 'Змінити тему на «темна»',
            }),
        ).toBeInTheDocument()
    })
})
