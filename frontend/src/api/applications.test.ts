import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './client'
import {
    createApplication,
    deleteApplication,
    getApplications,
    updateApplication,
    type CreateApplicationInput,
} from './applications'

vi.mock('./client', () => ({
    apiRequest: vi.fn(),
}))

const mockedApiRequest = vi.mocked(apiRequest)

const input: CreateApplicationInput = {
    company: 'Acme',
    position: 'Java Developer',
    jobUrl: null,
    jobDescription: null,
    currentStatus: 'APPLIED',
    appliedDate: '2026-07-27',
    followUpAt: null,
    notes: null,
}

describe('applications API', () => {
    beforeEach(() => {
        mockedApiRequest.mockReset()
    })

    it('builds list query parameters', () => {
        getApplications({
            search: 'java developer',
            status: 'INTERVIEW',
            page: 2,
            size: 5,
        })

        expect(mockedApiRequest).toHaveBeenCalledWith(
            '/api/applications?page=2&size=5&search=java+developer&status=INTERVIEW',
        )
    })

    it('sends a create request', () => {
        createApplication(input)

        expect(mockedApiRequest).toHaveBeenCalledWith(
            '/api/applications',
            {
                method: 'POST',
                body: JSON.stringify(input),
            },
        )
    })

    it('sends an update request', () => {
        updateApplication({ id: 7, input })

        expect(mockedApiRequest).toHaveBeenCalledWith(
            '/api/applications/7',
            {
                method: 'PUT',
                body: JSON.stringify(input),
            },
        )
    })

    it('sends a delete request', () => {
        deleteApplication(7)

        expect(mockedApiRequest).toHaveBeenCalledWith(
            '/api/applications/7',
            {
                method: 'DELETE',
            },
        )
    })
})
