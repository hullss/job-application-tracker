const API_URL =
    import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const AUTH_MESSAGE_KEY = 'authMessage'

type ProblemDetail = {
    title?: string
    detail?: string
}

export function consumeAuthMessage() {
    const message = sessionStorage.getItem(AUTH_MESSAGE_KEY)

    if (message) {
        sessionStorage.removeItem(AUTH_MESSAGE_KEY)
    }

    return message
}

function redirectToLogin() {
    window.history.replaceState(null, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const headers = new Headers(options.headers)

    if (options.body) {
        headers.set('Content-Type', 'application/json')
    }

    const accessToken = localStorage.getItem('accessToken')
    const isAuthEndpoint = path.startsWith('/api/auth/')

    if (accessToken && !isAuthEndpoint) {
        headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    })

    if (
        response.status === 401 &&
        accessToken &&
        !isAuthEndpoint
    ) {
        localStorage.removeItem('accessToken')
        sessionStorage.setItem(
            AUTH_MESSAGE_KEY,
            'Your session has expired. Please sign in again.',
        )
        redirectToLogin()

        throw new Error('Your session has expired')
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`

        try {
            const problem = (await response.json()) as ProblemDetail
            message = problem.detail ?? problem.title ?? message
        } catch {
            // The response does not contain a JSON error body.
        }

        throw new Error(message)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}
