import { useState } from 'react'

type Theme = 'light' | 'dark'

function getCurrentTheme(): Theme {
    return document.documentElement.dataset.theme === 'dark'
        ? 'dark'
        : 'light'
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(getCurrentTheme)

    function toggleTheme() {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'

        document.documentElement.dataset.theme = nextTheme
        localStorage.setItem('theme', nextTheme)
        setTheme(nextTheme)
    }

    const nextThemeLabel = theme === 'dark' ? 'light' : 'dark'

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${nextThemeLabel} theme`}
            title={`Switch to ${nextThemeLabel} theme`}
        >
            <span className="theme-toggle__icon" aria-hidden="true">
                {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span className="theme-toggle__label">
                {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
        </button>
    )
}
