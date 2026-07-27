import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { login } from '../api/auth'
import { consumeAuthMessage } from '../api/client'
import { ThemeToggle } from '../components/ThemeToggle'

export function LoginPage() {
    const navigate = useNavigate()

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
                    : 'Unable to log in',
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
                            Your career. Your next move.
                        </p>
                        <h1>Make every application count.</h1>
                        <p>
                            One calm place to organize opportunities, remember
                            every follow-up, and keep moving forward.
                        </p>
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
                            Your complete job search, finally in one focused
                            workspace.
                        </p>
                    </div>
                </div>

                <div className="auth-panel">
                    <div className="auth-panel__theme">
                        <ThemeToggle />
                    </div>

                    <div className="auth-panel__content">
                        <div className="auth-heading">
                            <p className="eyebrow">Welcome back</p>
                            <h2>Sign in to your account</h2>
                            <p>
                                Pick up where you left off.
                            </p>
                        </div>

                        <form
                            className="auth-form"
                            onSubmit={handleSubmit}
                        >
                            <label className="field">
                                <span>Email address</span>
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
                                <span>Password</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
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
                                    ? 'Signing in...'
                                    : 'Sign in'}
                            </button>
                        </form>

                        <p className="auth-switch">
                            Don&apos;t have an account?{' '}
                            <Link to="/register">Create one</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
