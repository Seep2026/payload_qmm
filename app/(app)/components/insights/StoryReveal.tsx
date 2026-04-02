import type { StoryArticle } from '../../types/qmmContent'

type StoryRevealProps = {
  article: StoryArticle
  expanded: boolean
  onToggle: () => void
}

export const StoryReveal = ({ article, expanded, onToggle }: StoryRevealProps) => {
  return (
    <section className="qmm-shell qmm-story-reveal">
      <button className="qmm-story-toggle" onClick={onToggle} type="button">
        <span>{expanded ? 'Close Story' : 'Open Story'}</span>
        <span aria-hidden="true">{expanded ? '↑' : '↓'}</span>
      </button>

      {expanded ? (
        <article className="qmm-inline-story">
          <h2>{article.title}</h2>
          {article.tags.length ? (
            <p className="qmm-inline-story-tags">{article.tags.join(' · ')}</p>
          ) : null}
          <p className="qmm-inline-story-subtitle">{article.subtitle}</p>
          <p className="qmm-inline-story-date">{article.date}</p>
          <div className="qmm-inline-story-content">
            {article.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}
