import {
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import {
    translate,
    type Language,
} from './translations'
import {
    LanguageContext,
    type LanguageContextValue,
} from './language-context'

function getInitialLanguage(): Language {
    const savedLanguage = localStorage.getItem('language')

    if (
        savedLanguage === 'en' ||
        savedLanguage === 'uk' ||
        savedLanguage === 'sk'
    ) {
        return savedLanguage
    }

    const browserLanguage = navigator.language.toLowerCase()

    if (browserLanguage.startsWith('uk')) {
        return 'uk'
    }

    if (browserLanguage.startsWith('sk')) {
        return 'sk'
    }

    return 'en'
}

export function LanguageProvider({
    children,
}: {
    children: ReactNode
}) {
    const [language, setLanguageState] =
        useState<Language>(getInitialLanguage)

    useEffect(() => {
        document.documentElement.lang = language
    }, [language])

    const value = useMemo<LanguageContextValue>(
        () => ({
            language,
            setLanguage: (nextLanguage) => {
                localStorage.setItem('language', nextLanguage)
                setLanguageState(nextLanguage)
            },
            t: (key, values) =>
                translate(language, key, values),
        }),
        [language],
    )

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}
