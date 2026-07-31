import type {
    EnglishLevel,
    SeniorityLevel,
    SkillGapAnalysis,
} from '../api/skillGap'
import { useLanguage } from '../i18n/language-context'

type SkillGapResultProps = {
    analysis: SkillGapAnalysis
}

function formatLevel(
    level: SeniorityLevel | EnglishLevel,
    notSpecified: string,
) {
    if (level === 'NOT_SPECIFIED') {
        return notSpecified
    }

    return level.charAt(0) + level.slice(1).toLowerCase()
}

function getMatchLabel(
    percentage: number,
    labels: {
        strong: string
        promising: string
        build: string
    },
) {
    if (percentage >= 80) {
        return labels.strong
    }

    if (percentage >= 50) {
        return labels.promising
    }

    return labels.build
}

export function SkillGapResult({
    analysis,
}: SkillGapResultProps) {
    const { t } = useLanguage()
    const percentage = Math.min(
        100,
        Math.max(0, analysis.match.matchPercentage),
    )

    return (
        <section
            className="skill-gap-result"
            aria-label={t('ai.resultLabel')}
        >
            <div className="skill-gap-result__summary">
                <div className="skill-gap-result__score">
                    <strong>{percentage}%</strong>
                    <span>
                        {getMatchLabel(percentage, {
                            strong: t('ai.strong'),
                            promising: t('ai.promising'),
                            build: t('ai.build'),
                        })}
                    </span>
                </div>

                <div className="skill-gap-result__overview">
                    <div
                        className="skill-gap-result__progress"
                        role="progressbar"
                        aria-label={t('ai.progressLabel')}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentage}
                    >
                        <span style={{ width: `${percentage}%` }} />
                    </div>

                    <div className="skill-gap-result__meta">
                        <span>
                            {t('ai.seniority')}:{' '}
                            <strong>
                                {formatLevel(
                                    analysis.requirements
                                        .seniorityLevel,
                                    t('ai.notSpecified'),
                                )}
                            </strong>
                        </span>
                        <span>
                            {t('ai.english')}:{' '}
                            <strong>
                                {formatLevel(
                                    analysis.requirements
                                        .englishLevel,
                                    t('ai.notSpecified'),
                                )}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            <div className="skill-gap-result__columns">
                <div>
                    <h4>{t('ai.matched')}</h4>
                    {analysis.match.matchedSkills.length > 0 ? (
                        <ul className="skill-chip-list">
                            {analysis.match.matchedSkills.map(
                                (skill) => (
                                    <li
                                        className="skill-chip skill-chip--matched"
                                        key={skill}
                                    >
                                        {skill}
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : (
                        <p>{t('ai.noMatched')}</p>
                    )}
                </div>

                <div>
                    <h4>{t('ai.missing')}</h4>
                    {analysis.match.missingSkills.length > 0 ? (
                        <ul className="skill-chip-list">
                            {analysis.match.missingSkills.map(
                                (skill) => (
                                    <li
                                        className="skill-chip skill-chip--missing"
                                        key={skill}
                                    >
                                        {skill}
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : (
                        <p>{t('ai.noMissing')}</p>
                    )}
                </div>
            </div>

            {analysis.match.matchedNiceToHaveSkills.length > 0 && (
                <p className="skill-gap-result__bonus">
                    <span>{t('ai.bonus')}</span>
                    {analysis.match.matchedNiceToHaveSkills.join(', ')}
                </p>
            )}
        </section>
    )
}
