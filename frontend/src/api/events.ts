import { apiRequest } from './client'

export type CalendarEventType =
    | 'INTERVIEW'
    | 'FOLLOW_UP'
    | 'DEADLINE'
    | 'OTHER'

export type CalendarEvent = {
    id: number
    applicationId: number
    company: string
    position: string
    type: CalendarEventType
    scheduledAt: string
    completedAt: string | null
    notes: string | null
}

export type CalendarEventInput = {
    type: CalendarEventType
    scheduledAt: string
    notes: string | null
}

export function getCalendarEvents(from: string, to: string) {
    const query = new URLSearchParams({ from, to })

    return apiRequest<CalendarEvent[]>(`/api/events?${query.toString()}`)
}

export function createCalendarEvent(
    applicationId: number,
    input: CalendarEventInput,
) {
    return apiRequest<CalendarEvent>(
        `/api/applications/${applicationId}/events`,
        {
            method: 'POST',
            body: JSON.stringify(input),
        },
    )
}

export function updateCalendarEvent(
    eventId: number,
    input: CalendarEventInput,
) {
    return apiRequest<CalendarEvent>(`/api/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
    })
}

export function completeCalendarEvent(eventId: number) {
    return apiRequest<CalendarEvent>(`/api/events/${eventId}/complete`, {
        method: 'PATCH',
    })
}

export function deleteCalendarEvent(eventId: number) {
    return apiRequest<void>(`/api/events/${eventId}`, {
        method: 'DELETE',
    })
}
