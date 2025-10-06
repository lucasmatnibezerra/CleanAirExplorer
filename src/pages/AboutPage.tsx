import { useTranslation } from 'react-i18next'

export function AboutPage(){
  const { t } = useTranslation()
  return (
    <div className="prose prose-invert max-w-2xl">
      <h1>{t('about.title','About This Prototype')}</h1>
      <p>{t('about.intro')}</p>
      <h2>{t('about.plannedSources')}</h2>
      <ul>
        <li>{t('about.sourceTempo')}</li>
        <li>{t('about.sourceOpenAq')}</li>
        <li>{t('about.sourcePandora')}</li>
        <li>{t('about.sourceWx')}</li>
      </ul>
      <h2>{t('about.roadmap')}</h2>
      <ul>
        <li>{t('about.featToggle')}</li>
        <li>{t('about.featFusion')}</li>
        <li>{t('about.featHealth')}</li>
        <li>{t('about.featTrends')}</li>
      </ul>
      <p>{t('about.disclaimer')}</p>
    </div>
  )
}
