import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { login, register } from '../api/auth'
import { ThemeToggle } from '../components/ThemeToggle'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../i18n/language-context'

export function RegisterPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'))
            return
        }

        setIsSubmitting(true)

        try {
            await register(email, password)

            const authResponse = await login(email, password)

            localStorage.setItem(
                'accessToken',
                authResponse.accessToken,
            )

            navigate('/applications', { replace: true })
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : t('auth.unableCreate'),
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-shell">
                <div className="auth-spotlight">
                    <div className="brand brand--light">
                        <span className="brand-mark">JT</span>
                        <span>JobTrack</span>
                    </div>

                    <div className="auth-spotlight__content">
                        <p className="eyebrow eyebrow--light">
                            {t('auth.registerEyebrow')}
                        </p>
                        <h1>{t('auth.registerHero')}</h1>
                        <p>{t('auth.registerHeroText')}</p>
                    </div>

                    <div
                        className="auth-visual auth-visual--rocket"
                        aria-hidden="true"
                    >
                        <div className="rocket-orbit rocket-orbit--one" />
                        <div className="rocket-orbit rocket-orbit--two" />
                        <div className="rocket-shape">↗</div>
                    </div>

                    <div className="auth-quote">
                        <span aria-hidden="true">✦</span>
                        <p>
                            {t('auth.registerQuote')}
                        </p>
                    </div>
                </div>

                <div className="auth-panel">
                    <div className="auth-panel__theme">
                        <LanguageSelector />
                        <ThemeToggle />
                    </div>

                    <div className="auth-panel__content">
                        <div className="auth-heading">
                            <p className="eyebrow">
                                {t('auth.getStarted')}
                            </p>
                            <h2>{t('auth.createAccountTitle')}</h2>
                            <p>{t('auth.createAccountSubtitle')}</p>
                        </div>

                        <form
                            className="auth-form"
                            onSubmit={handleSubmit}
                        >
                            <label className="field">
                                <span>{t('auth.email')}</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>{t('auth.password')}</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    placeholder={t('auth.passwordMin')}
                                    minLength={8}
                                    maxLength={72}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>
                                    {t('auth.confirmPassword')}
                                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    placeholder={t(
                                        'auth.repeatPassword',
                                    )}
                                    required
                                />
                            </label>

                            {error && (
                                <p className="alert alert--error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                className="button button--primary button--wide"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? t('auth.creatingAccount')
                                    : t('auth.createAccount')}
                            </button>
                        </form>

                        <p className="auth-switch">
                            {t('auth.haveAccount')}{' '}
                            <Link to="/login">
                                {t('auth.signIn')}
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
