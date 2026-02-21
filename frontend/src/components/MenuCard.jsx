import { useMemo, useState } from 'react';

export default function MenuCard({ item, t, revealIndex = 0 }) {
  const images = useMemo(() => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images;
    if (item.image) return [item.image];
    return ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'];
  }, [item.images, item.image]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasManyImages = images.length > 1;

  const goPrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`col-md-6 col-xl-4 reveal-on-scroll reveal-delay-${(revealIndex % 4) + 1}`}>
      <div className="menu-card h-100">
        <div className="menu-image-wrap mb-3">
          <img
            src={images[currentImageIndex]}
            alt={item.name}
            className="menu-image"
            loading="lazy"
            decoding="async"
            fetchPriority={revealIndex < 3 ? 'high' : 'low'}
          />
          {hasManyImages && (
            <>
              <button type="button" className="menu-slider-btn menu-slider-btn-left" onClick={goPrev} aria-label={t.menuCard.prevImage}>
                &#10094;
              </button>
              <button type="button" className="menu-slider-btn menu-slider-btn-right" onClick={goNext} aria-label={t.menuCard.nextImage}>
                &#10095;
              </button>
              <div className="menu-slider-counter">
                {currentImageIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="badge text-bg-warning">{item.category}</span>
          <span className="price-tag">{item.price.toFixed(2)} DH</span>
        </div>
        <h5>{item.name}</h5>
        <p>{item.description}</p>
        <div className="menu-rating-stars" aria-label={t.menuCard.ratingLabel}>
          <span className="is-on">&#9733;</span>
          <span className="is-on">&#9733;</span>
          <span className="is-on">&#9733;</span>
          <span className="is-on">&#9733;</span>
          <span>&#9733;</span>
        </div>
      </div>
    </div>
  );
}
