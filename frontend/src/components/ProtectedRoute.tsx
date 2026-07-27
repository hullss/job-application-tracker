import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

type ProtectedRouteProps = {
    children: ReactNode
}

export function ProtectedRoute({
                                   children,
                               }: ProtectedRouteProps) {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
        return <Navigate to="/login" replace />
    }

    return children
}