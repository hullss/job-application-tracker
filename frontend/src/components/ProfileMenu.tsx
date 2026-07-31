import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { SkillsManager } from './SkillsManager'
import { LanguageSelector } from './LanguageSelector'
import { useLanguage } from '../i18n/language-context'

type ProfileMenuProps = {
    onLogout: () => void
}

type JwtPayload = {
    sub?: string
}

function getEmailFromAccessToken() {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        return null
    }

    try {
        const encodedPayload = accessToken.split('.')[1]

        if (!encodedPayload) {
            return null
        }

        const normalizedPayload = encodedPayload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            '=',
        )
        const payload = JSON.parse(atob(paddedPayload)) as JwtPayload

        return payload.sub ?? null
    } catch {
        return null
    }
}

export function ProfileMenu({ onLogout }: ProfileMenuProps) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const tokenEmail = getEmailFromAccessToken()
    const email = tokenEmail ?? t('account.fallback')
    const accountName = tokenEmail
        ? tokenEmail.split('@')[0]
        : t('account.name')
    const initial = accountName.slice(0, 1).toUpperCase() || 'U'

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function closeOnOutsideClick(event: PointerEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('pointerdown', closeOnOutsideClick)
        document.addEventListener('keydown', closeOnEscape)

        return () => {
            document.removeEventListener(
                'pointerdown',
                closeOnOutsideClick,
            )
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [isOpen])

    return (
        <div className="profile-menu" ref={menuRef}>
            <button
                className="profile-trigger"
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <span className="profile-avatar" aria-hidden="true">
                    {initial}
                </span>
                <span className="profile-trigger__copy">
                    <strong>{accountName}</strong>
                    <small>{email}</small>
                </span>
                <span className="profile-trigger__chevron" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                </span>
            </button>

            {isOpen && (
                <div className="profile-dropdown" role="menu">
                    <div className="profile-dropdown__identity">
                        <span className="profile-avatar profile-avatar--large">
                            {initial}
                        </span>
                        <div>
                            <strong>{accountName}</strong>
                            <span>{email}</span>
                        </div>
                    </div>

                    <SkillsManager />

                    <div className="profile-dropdown__row">
                        <span>{t('theme.appearance')}</span>
                        <ThemeToggle />
                    </div>

                    <div className="profile-dropdown__row">
                        <span>{t('language.label')}</span>
                        <LanguageSelector />
                    </div>

                    <button
                        className="profile-dropdown__logout"
                        type="button"
                        role="menuitem"
                        onClick={onLogout}
                    >
                        {t('account.logout')}
                    </button>
                </div>
            )}
        </div>
    )
}
