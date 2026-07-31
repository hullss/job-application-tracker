import {
    BriefcaseBusiness,
    CalendarDays,
    ChartNoAxesCombined,
    LayoutDashboard,
    LogOut,
    Plus,
} from 'lucide-react'
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
                    <LayoutDashboard aria-hidden="true" />
                    {t('nav.dashboard')}
                </Link>

                <Link
                    className="sidebar-nav__item"
                    to="/applications#applications-list"
                >
                    <BriefcaseBusiness aria-hidden="true" />
                    {t('nav.applications')}
                </Link>

                <button
                    className="sidebar-nav__item"
                    type="button"
                    onClick={onAddApplication}
                >
                    <Plus aria-hidden="true" />
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
                    <CalendarDays aria-hidden="true" />
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
                    <ChartNoAxesCombined aria-hidden="true" />
                    {t('nav.statistics')}
                </Link>
            </nav>

            <button
                className="sidebar-logout"
                type="button"
                onClick={onLogout}
            >
                <LogOut aria-hidden="true" />
                {t('account.logout')}
            </button>
        </aside>
    )
}
