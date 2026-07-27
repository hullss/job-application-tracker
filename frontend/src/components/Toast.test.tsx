import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
    it('can be dismissed manually', () => {
        const onDismiss = vi.fn()

        render(
            <Toast
                message="Application saved"
                onDismiss={onDismiss}
            />,
        )

        expect(screen.getByRole('status')).toHaveTextContent(
            'Application saved',
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Dismiss notification',
            }),
        )

        expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('dismisses itself after the timeout', () => {
        vi.useFakeTimers()
        const onDismiss = vi.fn()

        render(
            <Toast
                message="Unable to save"
                kind="error"
                onDismiss={onDismiss}
            />,
        )

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Unable to save',
        )
        vi.advanceTimersByTime(3_500)

        expect(onDismiss).toHaveBeenCalledOnce()
        vi.useRealTimers()
    })
})
