export default function OffersPage({ t, specialOffers }) {
  return (
    <section className="container py-5 reveal-on-scroll">
      <h2 className="section-title mb-4">{t.app.offersTitle}</h2>
      <div className="offers-grid">
        {specialOffers.map((item, index) => (
          <article key={item.title} className={`offer-card reveal-on-scroll reveal-delay-${(index % 3) + 1}`}>
            <div className="offer-card-media">
              <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
            </div>
            <p className="service-kicker">{item.kicker}</p>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span className="offer-badge">{item.badge}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
