import { apiRequest } from './client'

export type SeniorityLevel =
    | 'INTERN'
    | 'JUNIOR'
    | 'MID'
    | 'SENIOR'
    | 'LEAD'
    | 'NOT_SPECIFIED'

export type EnglishLevel =
    | 'A1'
    | 'A2'
    | 'B1'
    | 'B2'
    | 'C1'
    | 'C2'
    | 'NOT_SPECIFIED'

export type SkillGapAnalysis = {
    requirements: {
        requiredSkills: string[]
        niceToHaveSkills: string[]
        seniorityLevel: SeniorityLevel
        englishLevel: EnglishLevel
    }
    match: {
        matchPercentage: number
        matchedSkills: string[]
        missingSkills: string[]
        matchedNiceToHaveSkills: string[]
    }
}

export function analyzeSkillGap(applicationId: number) {
    return apiRequest<SkillGapAnalysis>(
        `/api/applications/${applicationId}/skill-gap`,
        {
            method: 'POST',
        },
    )
}
