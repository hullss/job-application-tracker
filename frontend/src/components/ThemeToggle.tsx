import { useState } from 'react'
import { useLanguage } from '../i18n/language-context'

type Theme = 'light' | 'dark'

function getCurrentTheme(): Theme {
    return document.documentElement.dataset.theme === 'dark'
        ? 'dark'
        : 'light'
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(getCurrentTheme)
    const { t } = useLanguage()

    function toggleTheme() {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'

        document.documentElement.dataset.theme = nextTheme
        localStorage.setItem('theme', nextTheme)
        setTheme(nextTheme)
    }

    const nextThemeLabel =
        theme === 'dark'
            ? t('theme.light').toLowerCase()
            : t('theme.dark').toLowerCase()
    const label = t('theme.switch', {
        theme: nextThemeLabel,
    })

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={label}
            title={label}
        >
            <span className="theme-toggle__icon" aria-hidden="true">
                {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span className="theme-toggle__label">
                {theme === 'dark'
                    ? t('theme.light')
                    : t('theme.dark')}
            </span>
        </button>
    )
}
