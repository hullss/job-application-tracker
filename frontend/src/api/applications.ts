import {apiRequest} from './client'

export type ApplicationStatus =
    | 'APPLIED'
    | 'INTERVIEW'
    | 'OFFER'
    | 'REJECTED'

export type JobApplication = {
    id: number
    company: string
    position: string
    jobUrl: string | null
    jobDescription: string | null
    currentStatus: ApplicationStatus
    appliedDate: string
    followUpAt: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type ApplicationPage = {
    content: JobApplication[]
    page: number
    size: number
    totalElements: number
    totalPages: number
}

type GetApplicationsParams = {
    search?: string
    status?: ApplicationStatus
    page?: number
    size?: number
}

export function getApplications({
                                    search,
                                    status,
                                    page = 0,
                                    size = 10,
                                }: GetApplicationsParams = {}) {
    const query = new URLSearchParams({
        page: String(page),
        size: String(size),
    })

    if (search) {
        query.set('search', search)
    }

    if (status) {
        query.set('status', status)
    }

    return apiRequest<ApplicationPage>(
        `/api/applications?${query.toString()}`,
    )
}

export type CreateApplicationInput = {
    company: string
    position: string
    jobUrl: string | null
    jobDescription: string | null
    currentStatus: ApplicationStatus
    appliedDate: string
    followUpAt: string | null
    notes: string | null
}

export function createApplication(input: CreateApplicationInput) {
    return apiRequest<JobApplication>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function deleteApplication(id: number) {
    return apiRequest<void>(`/api/applications/${id}`, {
        method: 'DELETE',
    })
}

export type UpdateApplicationInput = CreateApplicationInput

type UpdateApplicationVariables = {
    id: number
    input: UpdateApplicationInput
}

export function updateApplication({
                                      id,
                                      input,
                                  }: UpdateApplicationVariables) {
    return apiRequest<JobApplication>(`/api/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
    })
}
