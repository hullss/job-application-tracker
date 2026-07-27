import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'

function renderProtectedRoute() {
    render(
        <MemoryRouter initialEntries={['/applications']}>
            <Routes>
                <Route
                    path="/login"
                    element={<h1>Login page</h1>}
                />
                <Route
                    path="/applications"
                    element={
                        <ProtectedRoute>
                            <h1>Applications page</h1>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('redirects to login without an access token', () => {
        renderProtectedRoute()

        expect(
            screen.getByRole('heading', { name: 'Login page' }),
        ).toBeInTheDocument()
    })

    it('renders the protected page with an access token', () => {
        localStorage.setItem('accessToken', 'test-token')

        renderProtectedRoute()

        expect(
            screen.getByRole('heading', {
                name: 'Applications page',
            }),
        ).toBeInTheDocument()
    })
})
