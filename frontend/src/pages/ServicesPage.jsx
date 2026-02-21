export default function ServicesPage({ t, classicServices }) {
  return (
    <section className="container py-5 reveal-on-scroll">
      <h2 className="section-title mb-4">{t.app.servicesTitle}</h2>
      <div className="services-grid">
        {classicServices.map((item, index) => (
          <article key={item.title} className={`service-card reveal-on-scroll reveal-delay-${(index % 3) + 1}`}>
            <div className="service-card-media">
              <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
            </div>
            <p className="service-kicker">{item.kicker}</p>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
