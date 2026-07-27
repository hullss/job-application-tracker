import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import {
    apiRequest,
    consumeAuthMessage,
} from './client'

function response(status: number, body?: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response
}

describe('apiRequest', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        fetchMock.mockReset()
        vi.stubGlobal('fetch', fetchMock)
        window.history.replaceState(null, '', '/applications')
    })

    it('adds the JWT to protected requests', async () => {
        localStorage.setItem('accessToken', 'test-token')
        fetchMock.mockResolvedValue(response(204))

        await apiRequest<void>('/api/applications')

        const options = fetchMock.mock.calls[0][1] as RequestInit
        const headers = new Headers(options.headers)

        expect(headers.get('Authorization')).toBe(
            'Bearer test-token',
        )
    })

    it('does not add the JWT to authentication requests', async () => {
        localStorage.setItem('accessToken', 'old-token')
        fetchMock.mockResolvedValue(
            response(200, { accessToken: 'new-token' }),
        )

        await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
            }),
        })

        const options = fetchMock.mock.calls[0][1] as RequestInit
        const headers = new Headers(options.headers)

        expect(headers.has('Authorization')).toBe(false)
    })

    it('parses successful JSON responses', async () => {
        fetchMock.mockResolvedValue(
            response(200, { company: 'Acme' }),
        )

        await expect(
            apiRequest('/api/applications/1'),
        ).resolves.toEqual({ company: 'Acme' })
    })

    it('uses the ProblemDetail message for failed requests', async () => {
        fetchMock.mockResolvedValue(
            response(400, {
                title: 'Validation failed',
                detail: 'Company is required',
            }),
        )

        await expect(
            apiRequest('/api/applications', {
                method: 'POST',
                body: JSON.stringify({}),
            }),
        ).rejects.toThrow('Company is required')
    })

    it('clears the session and redirects after a protected 401', async () => {
        localStorage.setItem('accessToken', 'expired-token')
        fetchMock.mockResolvedValue(response(401))

        await expect(
            apiRequest('/api/applications'),
        ).rejects.toThrow('Your session has expired')

        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(window.location.pathname).toBe('/login')
        expect(sessionStorage.getItem('authMessage')).toBe(
            'Your session has expired. Please sign in again.',
        )
    })

    it('consumes the authentication message once', () => {
        sessionStorage.setItem(
            'authMessage',
            'Your session has expired.',
        )

        expect(consumeAuthMessage()).toBe(
            'Your session has expired.',
        )
        expect(consumeAuthMessage()).toBeNull()
    })
})
