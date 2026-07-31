import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTimePicker } from './DateTimePicker'

describe('DateTimePicker', () => {
    it('changes the time without opening the native browser picker', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()

        render(
            <DateTimePicker
                value="2026-07-31T09:00"
                onChange={onChange}
                ariaLabel="Follow-up reminder"
                placeholder="Select date and time"
            />,
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Follow-up reminder',
            }),
        )
        await user.selectOptions(screen.getByLabelText('Hours'), '14')
        await user.selectOptions(screen.getByLabelText('Minutes'), '30')
        await user.click(
            screen.getByRole('button', { name: 'Apply' }),
        )

        expect(onChange).toHaveBeenCalledWith('2026-07-31T14:30')
    })

    it('allows an optional value to be cleared', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()

        render(
            <DateTimePicker
                value="2026-07-31T09:00"
                onChange={onChange}
                ariaLabel="Follow-up reminder"
                placeholder="Select date and time"
            />,
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Follow-up reminder',
            }),
        )
        await user.click(
            screen.getByRole('button', { name: 'Clear' }),
        )

        expect(onChange).toHaveBeenCalledWith('')
    })
})
