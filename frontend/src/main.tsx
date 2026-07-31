import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './styles.css'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { LanguageProvider } from './i18n/LanguageContext'

const savedTheme = localStorage.getItem('theme')
const initialTheme =
    savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : 'dark'

document.documentElement.dataset.theme = initialTheme

const queryClient = new QueryClient()
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LanguageProvider>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </BrowserRouter>
        </LanguageProvider>
    </StrictMode>,
)
