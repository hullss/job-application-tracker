import {apiRequest} from './client'

export type AuthResponse = {
    accessToken: string
    tokenType: string
    expiresIn: number
}

export function login(email: string, password: string) {
    return apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
    })
}

export type UserResponse = {
    id: number
    email: string
    createdAt: string
}

export function register(email: string, password: string) {
    return apiRequest<UserResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({email, password}),
    })
}