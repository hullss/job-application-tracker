import { useEffect } from 'react'
import { useLanguage } from '../i18n/language-context'

export type ToastKind = 'success' | 'error'

type ToastProps = {
    message: string
    kind?: ToastKind
    onDismiss: () => void
}

export function Toast({
    message,
    kind = 'success',
    onDismiss,
}: ToastProps) {
    const { t } = useLanguage()
    useEffect(() => {
        const timeoutId = window.setTimeout(onDismiss, 3500)

        return () => window.clearTimeout(timeoutId)
    }, [message, onDismiss])

    return (
        <div
            className={`toast toast--${kind}`}
            role={kind === 'error' ? 'alert' : 'status'}
            aria-live={kind === 'error' ? 'assertive' : 'polite'}
        >
            <span className="toast__indicator" aria-hidden="true" />
            <p>{message}</p>
            <button
                className="toast__close"
                type="button"
                onClick={onDismiss}
                aria-label={t('toast.dismiss')}
            >
                ×
            </button>
        </div>
    )
}
