import { useTranslation } from 'react-i18next'
import Accordion, { AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'

export function AboutPage(){
  const { t } = useTranslation()
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-invert mb-6">
          <h1 className="text-sm font-semibold text-neutral-200">{t('about.title','About This Prototype')}</h1>
          <p className="text-neutral-300 text-sm leading-relaxed">{t('about.intro')}</p>
        </div>

        <div className="w-full md:w-2/3 mx-0">
          <Accordion defaultValue={null}>
            <AccordionItem value="sources">
              <AccordionTrigger className="bg-neutral-800/40">{t('about.plannedSources')}</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>{t('about.sourceTempo')}</li>
                  <li>{t('about.sourceOpenAq')}</li>
                  <li>{t('about.sourcePandora')}</li>
                  <li>{t('about.sourceWx')}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="roadmap">
              <AccordionTrigger className="bg-neutral-800/40">{t('about.roadmap')}</AccordionTrigger>
              <AccordionContent>
                <ul className="list-decimal pl-5 space-y-1 text-neutral-300">
                  <li>{t('about.featToggle')}</li>
                  <li>{t('about.featFusion')}</li>
                  <li>{t('about.featHealth')}</li>
                  <li>{t('about.featTrends')}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="text-sm text-neutral-400 mt-4">{t('about.disclaimer')}</div>
        </div>
      </div>
    </div>
  )
}
