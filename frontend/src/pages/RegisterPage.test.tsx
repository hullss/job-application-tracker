import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { login, register } from '../api/auth'
import { RegisterPage } from './RegisterPage'

vi.mock('../api/auth', () => ({
    login: vi.fn(),
    register: vi.fn(),
}))

const mockedLogin = vi.mocked(login)
const mockedRegister = vi.mocked(register)

function renderRegisterPage() {
    render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/applications"
                    element={<h1>Applications dashboard</h1>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

async function fillRegistrationForm(
    password = 'password123',
    confirmation = password,
) {
    const user = userEvent.setup()

    await user.type(
        screen.getByLabelText('Email address'),
        'New.User@Example.com',
    )
    await user.type(screen.getByLabelText('Password'), password)
    await user.type(
        screen.getByLabelText('Confirm password'),
        confirmation,
    )
    await user.click(
        screen.getByRole('button', { name: 'Create account' }),
    )
}

describe('RegisterPage', () => {
    beforeEach(() => {
        mockedLogin.mockReset()
        mockedRegister.mockReset()
    })

    it('validates matching passwords before calling the API', async () => {
        renderRegisterPage()

        await fillRegistrationForm('password123', 'different123')

        expect(mockedRegister).not.toHaveBeenCalled()
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Passwords do not match',
        )
    })

    it('registers, logs in, stores the token and opens the dashboard', async () => {
        mockedRegister.mockResolvedValue({
            id: 1,
            email: 'new.user@example.com',
            createdAt: '2026-07-27T10:00:00Z',
        })
        mockedLogin.mockResolvedValue({
            accessToken: 'new-access-token',
            tokenType: 'Bearer',
            expiresIn: 86_400,
        })

        renderRegisterPage()
        await fillRegistrationForm()

        expect(mockedRegister).toHaveBeenCalledWith(
            'New.User@Example.com',
            'password123',
        )
        expect(mockedLogin).toHaveBeenCalledWith(
            'New.User@Example.com',
            'password123',
        )
        expect(localStorage.getItem('accessToken')).toBe(
            'new-access-token',
        )
        expect(
            await screen.findByRole('heading', {
                name: 'Applications dashboard',
            }),
        ).toBeInTheDocument()
    })

    it('shows a registration error and does not log in', async () => {
        mockedRegister.mockRejectedValue(
            new Error('Email is already registered'),
        )

        renderRegisterPage()
        await fillRegistrationForm()

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Email is already registered',
        )
        expect(mockedLogin).not.toHaveBeenCalled()
        expect(localStorage.getItem('accessToken')).toBeNull()
    })
})
