import { InsightsExperience } from './components/insights/InsightsExperience'
import { SiteFooter } from './components/site/SiteFooter'
import { SiteHeader } from './components/site/SiteHeader'
import { getActiveInsightExperienceUnits } from './server/qmmContent'

export const dynamic = 'force-dynamic'

export default async function InsightsHomePage() {
  const initialUnits = await getActiveInsightExperienceUnits()

  return (
    <main className="qmm-page">
      <SiteHeader active="insights" />
      <InsightsExperience initialUnits={initialUnits} />
      <SiteFooter />
    </main>
  )
}
