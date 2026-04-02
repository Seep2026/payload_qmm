import Link from 'next/link'

import type { StoryArticle } from '../../types/qmmContent'

type ArticleCardProps = {
  article: StoryArticle
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <Link className="qmm-article-card" href={`/stories/${article.slug}`}>
      <h3>{article.title}</h3>
      <p className="qmm-article-date">{article.date}</p>
      <p className="qmm-article-excerpt">{article.excerpt}</p>
      <span className="qmm-article-link">Read story →</span>
    </Link>
  )
}
