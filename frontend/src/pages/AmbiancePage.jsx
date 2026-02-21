import { useEffect, useState } from 'react';

const INITIAL_VISIBLE_ITEMS = 6;
const LOAD_MORE_STEP = 6;

function optimizeGalleryImage(url, width, quality) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (!raw.includes('images.unsplash.com')) return raw;

  try {
    const parsed = new URL(raw);
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', String(quality));
    return parsed.toString();
  } catch (error) {
    return raw;
  }
}

export default function AmbiancePage({ t, galleryImages, restaurantInfo }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS);
  }, [galleryImages.length]);

  const visibleImages = galleryImages.slice(0, visibleCount);
  const hasMore = visibleCount < galleryImages.length;

  return (
    <section className="container py-5 reveal-on-scroll">
      <h2 className="section-title mb-4">{t.app.ambianceTitle}</h2>
      <div className="gallery-grid">
        {visibleImages.map((image, index) => (
          <figure
            className={`gallery-item gallery-item--${index % 5 === 0 ? 'xl' : index % 3 === 0 ? 'tall' : 'wide'} reveal-on-scroll reveal-delay-${(index % 4) + 1}`}
            key={`${image}-${index}`}
          >
            <img
              src={optimizeGalleryImage(image, 960, 68)}
              srcSet={[
                `${optimizeGalleryImage(image, 420, 58)} 420w`,
                `${optimizeGalleryImage(image, 720, 64)} 720w`,
                `${optimizeGalleryImage(image, 960, 68)} 960w`
              ].join(', ')}
              sizes="(max-width: 640px) 94vw, (max-width: 992px) 48vw, 28vw"
              alt={`${restaurantInfo.restaurantName} ${index + 1}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              fetchPriority={index < 2 ? 'high' : 'low'}
              decoding="async"
            />
            <figcaption>
              <span>{restaurantInfo.restaurantName} {t.app.galleryLabel}</span>
              <small>{t.app.frameLabel} {String(index + 1).padStart(2, '0')}</small>
            </figcaption>
          </figure>
        ))}
      </div>
      {hasMore ? (
        <div className="text-center mt-4">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
          >
            Afficher plus
          </button>
        </div>
      ) : null}
    </section>
  );
}
