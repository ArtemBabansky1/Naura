import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import contactPhoto from '../../assets/business-cards-redesign/contact-3.webp'
import { EditorialTitle } from './EditorialTitle'
import { UserRound } from '../../components/UserRound/UserRound'
import { FOLDER_FRONT_PATH, FOLDER_BACK_PATH } from './connectionFolder'
import './CardConnectionStory.css'

// These panels share the hero's sticky stage and its one travelling card.
export function CardConnectionStory({ Action, children }) {
  const { t } = useTranslation('businessCards')
  const book = t('cardStory.book', { returnObjects: true })
  const folderId = `connection-folder-${useId().replace(/:/g, '')}`
  const folderClips = {
    '--folder-front-clip': `url(#${folderId}-front)`,
    '--folder-back-clip': `url(#${folderId}-back)`,
    '--folder-silhouette-clip': `url(#${folderId}-silhouette)`,
  }

  return <>
    <svg className="nc-folder-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${folderId}-front`} clipPathUnits="objectBoundingBox"><path className="nc-folder-shape" d={FOLDER_FRONT_PATH} /></clipPath>
        <clipPath id={`${folderId}-back`} clipPathUnits="objectBoundingBox"><path className="nc-folder-shape" d={FOLDER_BACK_PATH} /></clipPath>
        <clipPath id={`${folderId}-silhouette`} clipPathUnits="objectBoundingBox">
          <path className="nc-folder-shape" d={FOLDER_FRONT_PATH} /><path className="nc-folder-shape" d={FOLDER_BACK_PATH} />
        </clipPath>
      </defs>
    </svg>
    <section className="nc-card-story" aria-labelledby="nc-card-story-title">
      <p className="nc-eyebrow">{t('cinematic.storyLabel')}</p>
      <EditorialTitle id="nc-card-story-title" text={t('cardStory.title')} accent={t('cardStory.title').split(/ +/).slice(-2).join(" ")} reveal="scroll" />
      <p className="nc-card-story__description">{t('cardStory.description')}</p>
    </section>
    <div className="nc-connection__folder-back" style={folderClips} aria-hidden="true" />
    <div className="nc-card-flight" style={folderClips} data-clipped="false">
      <div className="nc-card-flight__window"><div className="nc-card-flight__content">{children}</div></div>
    </div>
    <section className="nc-connection" aria-labelledby="nc-connection-title">
      <div className="nc-connection__glass" style={folderClips} data-material="glass" aria-hidden="true">
        <div className="nc-connection__folder-labels">
          <span className="nc-connection__folder-count">
            <span className="nc-connection__folder-number"><span className="nc-connection__count-before">63</span><span className="nc-connection__count-after">64</span></span>
            <UserRound />
          </span>
          <span className="nc-connection__folder-title">{book.title}</span>
        </div>
        <svg className="nc-connection__rim" viewBox="0 0 1 1" preserveAspectRatio="none" fill="none" focusable="false">
          <path className="nc-folder-shape" d={FOLDER_FRONT_PATH} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="nc-connection__book">
        <div className="nc-connection__pages">
          <h2 id="nc-connection-title" className="nc-eyebrow">{book.title}</h2>
          <table className="nc-connection__table">
            <thead><tr>{book.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
            <tbody>{book.people.map(person => <tr key={person.name}>
              <th scope="row">{person.name}</th><td>{person.role}</td><td>{person.tags}</td><td>{person.added}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <article className="nc-connection__detail">
          <p className="nc-eyebrow">{book.savedLabel}</p>
          <div className="nc-connection__person">
            <img src={contactPhoto} alt="" loading="eager" decoding="async" />
            <div><h3>{book.people[0].name}</h3><p>{book.people[0].role}</p></div>
          </div>
          <ul className="nc-connection__tags">{book.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <dl>
            <div><dt>{book.noteLabel}</dt><dd>{book.note}</dd></div>
            <div><dt>{book.reminderLabel}</dt><dd>{book.reminder}</dd></div>
          </dl>
        </article>
      </div>
      <div className="nc-connection__copy">
        <p>{t('cardStory.connectionDescription')}</p>
        <Action className="bc2-button--light" href="#how-it-works">{t('cinematic.discover')}</Action>
      </div>
    </section>
  </>
}
