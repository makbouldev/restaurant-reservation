import MenuCard from '../components/MenuCard';
import SpecialCard from '../components/SpecialCard';
import ReservationForm from '../components/ReservationForm';
import { Link } from 'react-router-dom';
import { replaceParam } from '../i18n';
import heroBackgroundImage from '../assets/hero-background.jpg';
import reservationBackgroundImage from '../assets/reservation-background.jpg';

function pickMixedMenuItems(items, limit = 6) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const byCategory = new Map();
  items.forEach((item) => {
    const category = String(item?.category || 'Autres').trim() || 'Autres';
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(item);
  });

  const queues = Array.from(byCategory.values());
  const result = [];
  while (result.length < limit) {
    let progressed = false;
    for (const queue of queues) {
      if (queue.length > 0 && result.length < limit) {
        result.push(queue.shift());
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return result;
}

export default function HomePage({
  t,
  restaurantName,
  heroKickerText,
  heroTitleText,
  heroDescriptionText,
  specialOffers,
  menu,
  comments,
  activeComment,
  commentShiftClass,
  handleCommentWheel,
  renderCommentStars,
  activeCommentIndex,
  goToPrevComment,
  goToNextComment,
  commentForm,
  setCommentForm,
  commentStatus,
  submitComment,
  restaurantInfo,
  apiBase
}) {
  const heroBackground = heroBackgroundImage;
  const heroBackgroundStyle = {
    backgroundImage: `radial-gradient(circle at 14% 12%, rgba(255, 196, 110, 0.32), transparent 36%), radial-gradient(circle at 85% 0%, rgba(90, 209, 255, 0.22), transparent 34%), linear-gradient(120deg, rgba(8, 18, 34, 0.5) 8%, rgba(8, 18, 34, 0.2) 48%, rgba(8, 18, 34, 0.56) 100%), url('${heroBackground}')`
  };
  const mixedPreviewMenu = pickMixedMenuItems(menu, 6);

  return (
    <>
      <header className="hero-section" style={heroBackgroundStyle}>
        <div className="hero-overlay" />
        <div className="container hero-creative-wrap position-relative">
          <div className="hero-content">
            <p className="hero-kicker mb-1">{heroKickerText}</p>
            <h1 className="display-2 fw-bold">{heroTitleText}</h1>
            <p className="hero-lead mt-3">{heroDescriptionText}</p>
            <div className="hero-action-row">
              <Link to="/reservation" className="btn btn-warning btn-lg px-4 hero-cta">
                {t.app.reserveTable}
              </Link>
            </div>
          </div>
          <aside className="hero-photo-panel" aria-hidden="true">
            <div className="hero-photo-frame">
              <img
                src={heroBackground}
                alt={`${restaurantName} hero`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <span className="hero-photo-tag hero-photo-tag-top">{t.app.h1Text}</span>
              <span className="hero-photo-tag hero-photo-tag-bottom">{t.app.h2Text}</span>
            </div>
          </aside>
        </div>
      </header>

      <section className="container py-4 reveal-on-scroll">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="section-title m-0">{t.app.specialsTitle}</h2>
          <Link to="/offres-speciales" className="btn btn-outline-light btn-sm">
            {t.app.viewAllOffers || 'Voir tout'}
          </Link>
        </div>
        <div className="row g-4">
          {specialOffers.slice(0, 3).map((offer, index) => (
            <SpecialCard
              key={`${offer.title || 'offer'}-${index}`}
              special={{
                title: offer.title,
                text: offer.text,
                badge: offer.badge,
                image: offer.image
              }}
              revealIndex={index}
            />
          ))}
        </div>
      </section>

      <section className="container py-4 reveal-on-scroll">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="section-title m-0">{t.app.previewMenuTitle}</h2>
          <Link to="/menu" className="btn btn-outline-light btn-sm">{t.app.viewAllMenu}</Link>
        </div>
        <div className="row g-4">
          {mixedPreviewMenu.map((item, index) => (
            <MenuCard key={item.id} item={item} t={t} revealIndex={index} />
          ))}
        </div>
      </section>

      <section className="container py-4 reveal-on-scroll">
        <div className="comments-wrap">
          <div>
            <h2 className="section-title mb-3">{t.app.commentsTitle}</h2>
            <div className="comments-list comments-stage">
              {comments.length === 0 && (
                <article className="comment-item comment-item-empty">
                  <div className="comment-avatar comment-avatar-empty" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Z" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <h5>{t.app.noReviewsTitle}</h5>
                    <p>{replaceParam(t.app.firstReviewFor, 'restaurantName', restaurantInfo.restaurantName)}</p>
                  </div>
                </article>
              )}

              {activeComment && (
                <article
                  key={activeComment.id}
                  className={`comment-item comment-featured comment-carousel-frame ${commentShiftClass}`}
                  onWheel={handleCommentWheel}
                >
                  <div className="comment-quote-mark" aria-hidden="true">"</div>
                  <div className="comment-avatar" aria-hidden="true">
                    {(activeComment.name || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-content">
                    <div className="comment-head">
                      <h5>{activeComment.name}</h5>
                      {renderCommentStars(activeComment.rating)}
                    </div>
                    <p>{activeComment.text}</p>
                  </div>

                  <div className="comment-meta-strip">
                    <span className="comment-counter">
                      {activeCommentIndex + 1}/{comments.length}
                    </span>
                    <div className="comment-nav">
                      <button type="button" className="comment-nav-btn" onClick={goToPrevComment} disabled={comments.length < 2}>
                        {t.app.prevLabel}
                      </button>
                      <button type="button" className="comment-nav-btn comment-nav-btn-next" onClick={goToNextComment} disabled={comments.length < 2}>
                        {t.app.nextLabel}
                      </button>
                    </div>
                  </div>
                </article>
              )}
            </div>
          </div>
          <form className="reservation-box comment-form-box" onSubmit={submitComment}>
            <h3 className="mb-3">{t.app.leaveComment}</h3>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder={t.app.yourName}
                value={commentForm.name}
                onChange={(e) => setCommentForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small mb-1">{t.app.rating}</label>
              <select
                className="form-select"
                value={commentForm.rating}
                onChange={(e) => setCommentForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              >
                <option value={5}>{t.app.stars5}</option>
                <option value={4}>{t.app.stars4}</option>
                <option value={3}>{t.app.stars3}</option>
                <option value={2}>{t.app.stars2}</option>
                <option value={1}>{t.app.stars1}</option>
              </select>
            </div>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="4"
                placeholder={t.app.commentPlaceholder}
                value={commentForm.text}
                onChange={(e) => setCommentForm((prev) => ({ ...prev, text: e.target.value }))}
              />
            </div>
            <button className="btn btn-warning" type="submit">{t.app.publishLabel}</button>
            {commentStatus.text && <div className={`alert alert-${commentStatus.type} mt-3 mb-0`}>{commentStatus.text}</div>}
          </form>
        </div>
      </section>

      <section className="container py-4 reveal-on-scroll">
        <div className="map-wrap">
          <div className="map-header">
            <h2 className="section-title m-0">{t.app.mapTitle}</h2>
            <a
              href={restaurantInfo.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-light btn-sm"
            >
              {t.app.openInGoogleMaps}
            </a>
          </div>
          <div className="map-frame">
            <iframe
              title={`${restaurantInfo.restaurantName} ${t.app.mapTitle}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={restaurantInfo.mapEmbedUrl}
            />
          </div>
        </div>
      </section>

      <section className="container py-5 reveal-on-scroll">
        <h2 className="section-title mb-4">{t.app.reservationTitle}</h2>
        <ReservationForm apiBase={apiBase} t={t} panelImage={reservationBackgroundImage} />
      </section>
    </>
  );
}
