import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { getPublishedStoryBySlug } from '../../server/qmmContent'

export const revalidate = 120

type StoryDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function StoryDetailPage({ params }: StoryDetailPageProps) {
  const { slug } = await params
  const article = await getPublishedStoryBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <main className="qmm-page">
      <SiteHeader active="stories" />

      <article className="qmm-shell qmm-story-detail">
        <header>
          <h1>{article.title}</h1>
          <p className="qmm-story-subtitle">{article.subtitle}</p>
          <p className="qmm-story-date">{article.date}</p>
        </header>

        <section className="qmm-story-content">
          {article.content.length ? (
            article.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>{article.excerpt || 'No published story body is available yet.'}</p>
          )}
        </section>

        <div className="qmm-story-back">
          <Link href="/">Explore the related insight →</Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
