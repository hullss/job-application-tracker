import { Link } from 'react-router'
import { useLanguage } from '../i18n/language-context'

type DashboardSection = 'dashboard' | 'calendar' | 'statistics'

type DashboardSidebarProps = {
    active: DashboardSection
    onAddApplication: () => void
    onLogout: () => void
}

export function DashboardSidebar({
    active,
    onAddApplication,
    onLogout,
}: DashboardSidebarProps) {
    const { t } = useLanguage()

    return (
        <aside className="dashboard-sidebar">
            <Link className="brand" to="/applications">
                <span className="brand-mark">JT</span>
                <span>JobTrack</span>
            </Link>

            <nav className="sidebar-nav" aria-label={t('nav.main')}>
                <Link
                    className={`sidebar-nav__item ${
                        active === 'dashboard'
                            ? 'sidebar-nav__item--active'
                            : ''
                    }`}
                    to="/applications"
                >
                    <span aria-hidden="true">⌂</span>
                    {t('nav.dashboard')}
                </Link>

                <Link
                    className="sidebar-nav__item"
                    to="/applications#applications-list"
                >
                    <span aria-hidden="true">▤</span>
                    {t('nav.applications')}
                </Link>

                <button
                    className="sidebar-nav__item"
                    type="button"
                    onClick={onAddApplication}
                >
                    <span aria-hidden="true">＋</span>
                    {t('nav.addApplication')}
                </button>

                <Link
                    className={`sidebar-nav__item ${
                        active === 'calendar'
                            ? 'sidebar-nav__item--active'
                            : ''
                    }`}
                    to="/calendar"
                >
                    <span aria-hidden="true">◫</span>
                    {t('nav.calendar')}
                </Link>

                <Link
                    className={`sidebar-nav__item ${
                        active === 'statistics'
                            ? 'sidebar-nav__item--active'
                            : ''
                    }`}
                    to="/statistics"
                >
                    <span aria-hidden="true">◒</span>
                    {t('nav.statistics')}
                </Link>
            </nav>

            <button
                className="sidebar-logout"
                type="button"
                onClick={onLogout}
            >
                <span aria-hidden="true">↪</span>
                {t('account.logout')}
            </button>
        </aside>
    )
}
