import { Navigate, Route, Routes } from 'react-router'
import { ApplicationsPage } from './pages/ApplicationsPage.tsx'
import { CalendarPage } from './pages/CalendarPage.tsx'
import { StatisticsPage } from './pages/StatisticsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/applications"
                element={
                    <ProtectedRoute>
                        <ApplicationsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/calendar"
                element={
                    <ProtectedRoute>
                        <CalendarPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/statistics"
                element={
                    <ProtectedRoute>
                        <StatisticsPage />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

export default App
