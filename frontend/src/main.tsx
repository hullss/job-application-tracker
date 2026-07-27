import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './styles.css'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'

const savedTheme = localStorage.getItem('theme')
const initialTheme =
    savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : 'dark'

document.documentElement.dataset.theme = initialTheme

const queryClient = new QueryClient()
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>,
)
