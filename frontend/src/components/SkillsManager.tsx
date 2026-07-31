import { useState, type FormEvent } from 'react'
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import {
    createSkill,
    deleteSkill,
    getSkills,
    type UserSkill,
} from '../api/skills'
import { useLanguage } from '../i18n/language-context'

const SKILLS_QUERY_KEY = ['profile-skills'] as const

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error
        ? error.message
        : fallback
}

export function SkillsManager() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const [skillName, setSkillName] = useState('')

    const skillsQuery = useQuery({
        queryKey: SKILLS_QUERY_KEY,
        queryFn: getSkills,
    })

    const createMutation = useMutation({
        mutationFn: (name: string) => createSkill(name),
        onSuccess: (savedSkill) => {
            setSkillName('')
            queryClient.setQueryData<UserSkill[]>(
                SKILLS_QUERY_KEY,
                (current = []) =>
                    [...current, savedSkill].sort((first, second) =>
                        first.name.localeCompare(second.name),
                    ),
            )
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteSkill(id),
        onSuccess: (_, deletedId) => {
            queryClient.setQueryData<UserSkill[]>(
                SKILLS_QUERY_KEY,
                (current = []) =>
                    current.filter((skill) => skill.id !== deletedId),
            )
        },
    })

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmedName = skillName.trim()

        if (!trimmedName || createMutation.isPending) {
            return
        }

        createMutation.mutate(trimmedName)
    }

    const mutationError =
        createMutation.error ?? deleteMutation.error
    const skills = skillsQuery.data ?? []

    return (
        <section
            className="skills-manager"
            aria-labelledby="profile-skills-title"
        >
            <div className="skills-manager__heading">
                <div>
                    <h3 id="profile-skills-title">
                        {t('skills.title')}
                    </h3>
                    <p>{t('skills.subtitle')}</p>
                </div>
                <span>{skills.length}</span>
            </div>

            <form
                className="skills-manager__form"
                onSubmit={handleSubmit}
            >
                <input
                    value={skillName}
                    onChange={(event) => {
                        setSkillName(event.target.value)
                        createMutation.reset()
                    }}
                    maxLength={100}
                    placeholder={t('skills.placeholder')}
                    aria-label={t('skills.name')}
                />
                <button
                    type="submit"
                    disabled={
                        !skillName.trim() ||
                        createMutation.isPending
                    }
                >
                    {createMutation.isPending
                        ? t('skills.adding')
                        : t('skills.add')}
                </button>
            </form>

            {skillsQuery.isPending && (
                <p className="skills-manager__state">
                    {t('skills.loading')}
                </p>
            )}

            {skillsQuery.isError && (
                <p className="skills-manager__error" role="alert">
                    {getErrorMessage(
                        skillsQuery.error,
                        t('skills.error'),
                    )}
                </p>
            )}

            {skillsQuery.isSuccess && skills.length === 0 && (
                <p className="skills-manager__state">
                    {t('skills.empty')}
                </p>
            )}

            {skills.length > 0 && (
                <ul className="skills-manager__list">
                    {skills.map((skill) => {
                        const isDeleting =
                            deleteMutation.isPending &&
                            deleteMutation.variables === skill.id

                        return (
                            <li key={skill.id}>
                                <span>{skill.name}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        deleteMutation.reset()
                                        deleteMutation.mutate(skill.id)
                                    }}
                                    disabled={isDeleting}
                                    aria-label={t('skills.remove', {
                                        skill: skill.name,
                                    })}
                                >
                                    {isDeleting ? '…' : '×'}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            {mutationError && (
                <p className="skills-manager__error" role="alert">
                    {getErrorMessage(
                        mutationError,
                        t('skills.error'),
                    )}
                </p>
            )}
        </section>
    )
}
