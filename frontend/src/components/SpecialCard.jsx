export default function SpecialCard({ special, revealIndex = 0 }) {
  return (
    <div className={`col-md-4 reveal-on-scroll reveal-delay-${(revealIndex % 4) + 1}`}>
      <div className="special-card h-100">
        <img
          src={special.image}
          alt={special.title}
          className="special-image mb-3"
          loading="lazy"
          decoding="async"
          fetchPriority={revealIndex === 0 ? 'high' : 'low'}
        />
        <span className="special-badge">{special.badge}</span>
        <h4>{special.title}</h4>
        <p>{special.text}</p>
      </div>
    </div>
  );
}
