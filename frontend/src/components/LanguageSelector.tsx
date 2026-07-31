import {
    useLanguage,
} from '../i18n/language-context'
import type { Language } from '../i18n/translations'

export function LanguageSelector() {
    const { language, setLanguage, t } = useLanguage()

    return (
        <label className="language-selector">
            <span className="sr-only">{t('language.label')}</span>
            <select
                value={language}
                onChange={(event) =>
                    setLanguage(event.target.value as Language)
                }
                aria-label={t('language.label')}
            >
                <option value="uk">{t('language.uk')}</option>
                <option value="sk">{t('language.sk')}</option>
                <option value="en">{t('language.en')}</option>
            </select>
        </label>
    )
}
