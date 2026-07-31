import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/language-context'
import type { Language } from '../i18n/translations'

type DateTimePickerMode = 'date' | 'datetime'

type DateTimePickerProps = {
    value: string
    onChange: (value: string) => void
    ariaLabel: string
    placeholder: string
    mode?: DateTimePickerMode
    required?: boolean
    disabled?: boolean
}

type PickerPosition = {
    top: number
    left: number
    width: number
}

const LANGUAGE_LOCALES: Record<Language, string> = {
    en: 'en-US',
    uk: 'uk-UA',
    sk: 'sk-SK',
}

function startOfDay(date: Date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    )
}

function addDays(date: Date, amount: number) {
    const result = new Date(date)
    result.setDate(result.getDate() + amount)
    return result
}

function dateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function isSameDay(first: Date, second: Date) {
    return dateKey(first) === dateKey(second)
}

function parseValue(value: string) {
    const [datePart, timePart] = value.split('T')
    const [year, month, day] = datePart
        .split('-')
        .map((part) => Number(part))

    if (!year || !month || !day) {
        return null
    }

    const date = new Date(year, month - 1, day)
    const [hours = 9, minutes = 0] = (timePart ?? '')
        .split(':')
        .map((part) => Number(part))

    return {
        date,
        hours: Number.isFinite(hours) ? hours : 9,
        minutes: Number.isFinite(minutes) ? minutes : 0,
    }
}

function pickerPosition(
    anchor: DOMRect,
    mode: DateTimePickerMode,
): PickerPosition {
    const viewportPadding = 12
    const width = Math.min(354, window.innerWidth - viewportPadding * 2)
    const estimatedHeight = mode === 'datetime' ? 438 : 368
    const spaceBelow = window.innerHeight - anchor.bottom
    const top =
        spaceBelow >= estimatedHeight + viewportPadding
            ? anchor.bottom + 8
            : Math.max(
                  viewportPadding,
                  anchor.top - estimatedHeight - 8,
              )
    const left = Math.min(
        Math.max(viewportPadding, anchor.left),
        window.innerWidth - width - viewportPadding,
    )

    return { top, left, width }
}

export function DateTimePicker({
    value,
    onChange,
    ariaLabel,
    placeholder,
    mode = 'datetime',
    required = false,
    disabled = false,
}: DateTimePickerProps) {
    const { language, t } = useLanguage()
    const locale = LANGUAGE_LOCALES[language]
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const initial = parseValue(value)
    const [open, setOpen] = useState(false)
    const [draftDate, setDraftDate] = useState(
        () => initial?.date ?? startOfDay(new Date()),
    )
    const [cursorMonth, setCursorMonth] = useState(
        () =>
            new Date(
                (initial?.date ?? new Date()).getFullYear(),
                (initial?.date ?? new Date()).getMonth(),
                1,
            ),
    )
    const [hours, setHours] = useState(
        () => String(initial?.hours ?? 9).padStart(2, '0'),
    )
    const [minutes, setMinutes] = useState(
        () => String(initial?.minutes ?? 0).padStart(2, '0'),
    )
    const [position, setPosition] = useState<PickerPosition>({
        top: 0,
        left: 0,
        width: 354,
    })

    const monthStart = new Date(
        cursorMonth.getFullYear(),
        cursorMonth.getMonth(),
        1,
    )
    const gridStart = addDays(
        monthStart,
        -((monthStart.getDay() + 6) % 7),
    )
    const calendarDays = useMemo(
        () => Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)),
        [gridStart],
    )
    const weekdayLabels = useMemo(() => {
        const monday = new Date(2026, 0, 5)
        const formatter = new Intl.DateTimeFormat(locale, {
            weekday: 'short',
        })

        return Array.from({ length: 7 }, (_, index) =>
            formatter.format(addDays(monday, index)),
        )
    }, [locale])
    const monthLabel = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
    }).format(cursorMonth)

    useEffect(() => {
        if (!open) {
            return
        }

        function closeOnOutsideClick(event: MouseEvent) {
            const target = event.target as Node

            if (
                !triggerRef.current?.contains(target) &&
                !popoverRef.current?.contains(target)
            ) {
                setOpen(false)
            }
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false)
                triggerRef.current?.focus()
            }
        }

        function reposition() {
            if (triggerRef.current) {
                setPosition(
                    pickerPosition(
                        triggerRef.current.getBoundingClientRect(),
                        mode,
                    ),
                )
            }
        }

        document.addEventListener('mousedown', closeOnOutsideClick)
        document.addEventListener('keydown', closeOnEscape)
        window.addEventListener('resize', reposition)
        window.addEventListener('scroll', reposition, true)

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick)
            document.removeEventListener('keydown', closeOnEscape)
            window.removeEventListener('resize', reposition)
            window.removeEventListener('scroll', reposition, true)
        }
    }, [mode, open])

    function openPicker() {
        if (disabled || !triggerRef.current) {
            return
        }

        const parsed = parseValue(value)
        const nextDate = parsed?.date ?? startOfDay(new Date())
        setDraftDate(nextDate)
        setCursorMonth(
            new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
        )
        setHours(String(parsed?.hours ?? 9).padStart(2, '0'))
        setMinutes(String(parsed?.minutes ?? 0).padStart(2, '0'))
        setPosition(
            pickerPosition(
                triggerRef.current.getBoundingClientRect(),
                mode,
            ),
        )
        setOpen(true)
    }

    function selectDate(date: Date) {
        setDraftDate(startOfDay(date))

        if (
            date.getMonth() !== cursorMonth.getMonth() ||
            date.getFullYear() !== cursorMonth.getFullYear()
        ) {
            setCursorMonth(
                new Date(date.getFullYear(), date.getMonth(), 1),
            )
        }
    }

    function chooseToday() {
        const today = startOfDay(new Date())
        setDraftDate(today)
        setCursorMonth(
            new Date(today.getFullYear(), today.getMonth(), 1),
        )
    }

    function applyValue() {
        const date = dateKey(draftDate)
        onChange(
            mode === 'datetime'
                ? `${date}T${hours}:${minutes}`
                : date,
        )
        setOpen(false)
        triggerRef.current?.focus()
    }

    function clearValue() {
        onChange('')
        setOpen(false)
        triggerRef.current?.focus()
    }

    const parsedValue = parseValue(value)
    const displayValue = parsedValue
        ? new Intl.DateTimeFormat(
              locale,
              mode === 'datetime'
                  ? { dateStyle: 'medium', timeStyle: 'short' }
                  : { dateStyle: 'medium' },
          ).format(
              new Date(
                  parsedValue.date.getFullYear(),
                  parsedValue.date.getMonth(),
                  parsedValue.date.getDate(),
                  parsedValue.hours,
                  parsedValue.minutes,
              ),
          )
        : ''

    return (
        <div className="date-time-picker">
            <button
                className={`date-time-picker__trigger ${
                    open ? 'is-open' : ''
                }`}
                type="button"
                ref={triggerRef}
                aria-label={ariaLabel}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-required={required}
                disabled={disabled}
                onClick={() => (open ? setOpen(false) : openPicker())}
            >
                <span
                    className={
                        displayValue
                            ? 'date-time-picker__value'
                            : 'date-time-picker__placeholder'
                    }
                >
                    {displayValue || placeholder}
                </span>
                <span aria-hidden="true">◫</span>
            </button>

            {open &&
                createPortal(
                    <div
                        className="date-time-popover"
                        ref={popoverRef}
                        role="dialog"
                        aria-label={ariaLabel}
                        style={
                            {
                                '--picker-top': `${position.top}px`,
                                '--picker-left': `${position.left}px`,
                                '--picker-width': `${position.width}px`,
                            } as CSSProperties
                        }
                    >
                        <header className="date-time-popover__header">
                            <button
                                type="button"
                                aria-label={t('picker.previousMonth')}
                                onClick={() =>
                                    setCursorMonth(
                                        new Date(
                                            cursorMonth.getFullYear(),
                                            cursorMonth.getMonth() - 1,
                                            1,
                                        ),
                                    )
                                }
                            >
                                ‹
                            </button>
                            <strong>{monthLabel}</strong>
                            <button
                                type="button"
                                aria-label={t('picker.nextMonth')}
                                onClick={() =>
                                    setCursorMonth(
                                        new Date(
                                            cursorMonth.getFullYear(),
                                            cursorMonth.getMonth() + 1,
                                            1,
                                        ),
                                    )
                                }
                            >
                                ›
                            </button>
                        </header>

                        <div className="date-time-popover__weekdays">
                            {weekdayLabels.map((label) => (
                                <span key={label}>{label}</span>
                            ))}
                        </div>

                        <div className="date-time-popover__days">
                            {calendarDays.map((day) => (
                                <button
                                    className={`${
                                        day.getMonth() !==
                                        cursorMonth.getMonth()
                                            ? 'is-outside'
                                            : ''
                                    } ${
                                        isSameDay(day, draftDate)
                                            ? 'is-selected'
                                            : ''
                                    } ${
                                        isSameDay(day, new Date())
                                            ? 'is-today'
                                            : ''
                                    }`}
                                    type="button"
                                    key={dateKey(day)}
                                    aria-label={new Intl.DateTimeFormat(
                                        locale,
                                        { dateStyle: 'full' },
                                    ).format(day)}
                                    aria-pressed={isSameDay(day, draftDate)}
                                    onClick={() => selectDate(day)}
                                >
                                    {day.getDate()}
                                </button>
                            ))}
                        </div>

                        {mode === 'datetime' && (
                            <div className="date-time-popover__time">
                                <span aria-hidden="true">◷</span>
                                <label>
                                    <span>{t('picker.hours')}</span>
                                    <select
                                        value={hours}
                                        onChange={(event) =>
                                            setHours(event.target.value)
                                        }
                                    >
                                        {Array.from(
                                            { length: 24 },
                                            (_, hour) => (
                                                <option
                                                    key={hour}
                                                    value={String(
                                                        hour,
                                                    ).padStart(2, '0')}
                                                >
                                                    {String(hour).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                                <strong>:</strong>
                                <label>
                                    <span>{t('picker.minutes')}</span>
                                    <select
                                        value={minutes}
                                        onChange={(event) =>
                                            setMinutes(event.target.value)
                                        }
                                    >
                                        {Array.from(
                                            { length: 60 },
                                            (_, minute) => (
                                                <option
                                                    key={minute}
                                                    value={String(
                                                        minute,
                                                    ).padStart(2, '0')}
                                                >
                                                    {String(minute).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                            </div>
                        )}

                        <footer className="date-time-popover__footer">
                            <div>
                                {!required && (
                                    <button
                                        className="date-time-popover__clear"
                                        type="button"
                                        onClick={clearValue}
                                    >
                                        {t('filter.clear')}
                                    </button>
                                )}
                                <button
                                    className="date-time-popover__today"
                                    type="button"
                                    onClick={chooseToday}
                                >
                                    {t('calendar.today')}
                                </button>
                            </div>
                            <button
                                className="date-time-popover__apply"
                                type="button"
                                onClick={applyValue}
                            >
                                {t('picker.apply')}
                            </button>
                        </footer>
                    </div>,
                    document.body,
                )}
        </div>
    )
}
