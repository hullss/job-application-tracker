import { apiRequest } from './client'

export type UserSkill = {
    id: number
    name: string
}

export function getSkills() {
    return apiRequest<UserSkill[]>('/api/profile/skills')
}

export function createSkill(name: string) {
    return apiRequest<UserSkill>('/api/profile/skills', {
        method: 'POST',
        body: JSON.stringify({ name }),
    })
}

export function deleteSkill(id: number) {
    return apiRequest<void>(`/api/profile/skills/${id}`, {
        method: 'DELETE',
    })
}
