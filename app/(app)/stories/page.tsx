import { SiteFooter } from '../components/site/SiteFooter'
import { SiteHeader } from '../components/site/SiteHeader'
import { ArticleCard } from '../components/stories/ArticleCard'
import { getPublishedStories } from '../server/qmmContent'

export const revalidate = 120

export default async function StoriesPage() {
  const articles = await getPublishedStories()

  return (
    <main className="qmm-page">
      <SiteHeader active="stories" />

      <section className="qmm-shell qmm-stories-page">
        <header className="qmm-stories-head">
          <h1>Stories</h1>
          <p>
            Written reflections on the emotional patterns we carry, the deeper context behind each
            insight set.
          </p>
        </header>

        <div className="qmm-stories-grid">
          {articles.length ? (
            articles.map((article) => <ArticleCard article={article} key={article.slug} />)
          ) : (
            <p className="qmm-empty-note">No published stories available yet.</p>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
