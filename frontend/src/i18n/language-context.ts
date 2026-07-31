import { createContext, useContext } from 'react'
import {
    translate,
    type Language,
    type TranslationValues,
} from './translations'

export type LanguageContextValue = {
    language: Language
    setLanguage: (language: Language) => void
    t: (key: string, values?: TranslationValues) => string
}

export const LanguageContext =
    createContext<LanguageContextValue>({
        language: 'en',
        setLanguage: () => undefined,
        t: (key, values) => translate('en', key, values),
    })

export function useLanguage() {
    return useContext(LanguageContext)
}
