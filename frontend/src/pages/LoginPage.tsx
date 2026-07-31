import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { login } from '../api/auth'
import { consumeAuthMessage } from '../api/client'
import { ThemeToggle } from '../components/ThemeToggle'
import { LanguageSelector } from '../components/LanguageSelector'
import { useLanguage } from '../i18n/language-context'

export function LoginPage() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(
        consumeAuthMessage,
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError(null)
        setNotice(null)
        setIsSubmitting(true)

        try {
            const response = await login(email, password)

            localStorage.setItem(
                'accessToken',
                response.accessToken,
            )

            navigate('/applications', { replace: true })
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : t('auth.unableLogin'),
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
                            {t('auth.careerEyebrow')}
                        </p>
                        <h1>{t('auth.loginHero')}</h1>
                        <p>{t('auth.loginHeroText')}</p>
                    </div>

                    <div
                        className="auth-visual auth-visual--briefcase"
                        aria-hidden="true"
                    >
                        <div className="auth-visual__grid" />
                        <div className="briefcase-shape">
                            <span />
                        </div>
                    </div>

                    <div className="auth-quote">
                        <span aria-hidden="true">✦</span>
                        <p>
                            {t('auth.loginQuote')}
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
                                {t('auth.welcomeBack')}
                            </p>
                            <h2>{t('auth.signInTitle')}</h2>
                            <p>{t('auth.signInSubtitle')}</p>
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
                                    autoComplete="current-password"
                                    placeholder={t(
                                        'auth.passwordPlaceholder',
                                    )}
                                    required
                                />
                            </label>

                            {notice && (
                                <p className="alert alert--info" role="status">
                                    {notice}
                                </p>
                            )}

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
                                    ? t('auth.signingIn')
                                    : t('auth.signIn')}
                            </button>
                        </form>

                        <p className="auth-switch">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register">
                                {t('auth.createOne')}
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
