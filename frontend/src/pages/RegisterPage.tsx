import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { login, register } from '../api/auth'
import { ThemeToggle } from '../components/ThemeToggle'

export function RegisterPage() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
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
                    : 'Unable to create account',
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
                            Create your career space
                        </p>
                        <h1>Start organized. Stay confident.</h1>
                        <p>
                            Build a clear application pipeline and turn every
                            next step into visible progress.
                        </p>
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
                            Your opportunities, notes, dates, and decisions —
                            together from day one.
                        </p>
                    </div>
                </div>

                <div className="auth-panel">
                    <div className="auth-panel__theme">
                        <ThemeToggle />
                    </div>

                    <div className="auth-panel__content">
                        <div className="auth-heading">
                            <p className="eyebrow">Get started</p>
                            <h2>Create your account</h2>
                            <p>
                                Set up your private job search workspace.
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
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    minLength={8}
                                    maxLength={72}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Confirm password</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    placeholder="Repeat your password"
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
                                    ? 'Creating account...'
                                    : 'Create account'}
                            </button>
                        </form>

                        <p className="auth-switch">
                            Already have an account?{' '}
                            <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
