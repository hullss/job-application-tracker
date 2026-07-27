import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { login } from '../api/auth'
import { LoginPage } from './LoginPage'

vi.mock('../api/auth', () => ({
    login: vi.fn(),
}))

const mockedLogin = vi.mocked(login)

function renderLoginPage() {
    render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/applications"
                    element={<h1>Applications dashboard</h1>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('LoginPage', () => {
    beforeEach(() => {
        mockedLogin.mockReset()
    })

    it('renders the login form', () => {
        renderLoginPage()

        expect(
            screen.getByLabelText('Email address'),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Sign in' }),
        ).toBeInTheDocument()
    })

    it('stores the token and opens the dashboard after login', async () => {
        mockedLogin.mockResolvedValue({
            accessToken: 'test-access-token',
            tokenType: 'Bearer',
            expiresIn: 86_400,
        })

        const user = userEvent.setup()
        renderLoginPage()

        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        )
        await user.type(
            screen.getByLabelText('Password'),
            'password123',
        )
        await user.click(
            screen.getByRole('button', { name: 'Sign in' }),
        )

        expect(mockedLogin).toHaveBeenCalledWith(
            'test@example.com',
            'password123',
        )
        expect(localStorage.getItem('accessToken')).toBe(
            'test-access-token',
        )
        expect(
            await screen.findByRole('heading', {
                name: 'Applications dashboard',
            }),
        ).toBeInTheDocument()
    })

    it('shows an authentication error', async () => {
        mockedLogin.mockRejectedValue(
            new Error('Invalid email or password'),
        )

        const user = userEvent.setup()
        renderLoginPage()

        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        )
        await user.type(
            screen.getByLabelText('Password'),
            'wrong-password',
        )
        await user.click(
            screen.getByRole('button', { name: 'Sign in' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Invalid email or password',
        )
        expect(localStorage.getItem('accessToken')).toBeNull()
    })
})
