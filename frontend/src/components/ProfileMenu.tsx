import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

type ProfileMenuProps = {
    onLogout: () => void
}

type JwtPayload = {
    sub?: string
}

function getEmailFromAccessToken() {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        return 'Signed-in user'
    }

    try {
        const encodedPayload = accessToken.split('.')[1]

        if (!encodedPayload) {
            return 'Signed-in user'
        }

        const normalizedPayload = encodedPayload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            '=',
        )
        const payload = JSON.parse(atob(paddedPayload)) as JwtPayload

        return payload.sub ?? 'Signed-in user'
    } catch {
        return 'Signed-in user'
    }
}

export function ProfileMenu({ onLogout }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const email = getEmailFromAccessToken()
    const accountName =
        email === 'Signed-in user' ? 'Account' : email.split('@')[0]
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

                    <div className="profile-dropdown__row">
                        <span>Appearance</span>
                        <ThemeToggle />
                    </div>

                    <button
                        className="profile-dropdown__logout"
                        type="button"
                        role="menuitem"
                        onClick={onLogout}
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    )
}
