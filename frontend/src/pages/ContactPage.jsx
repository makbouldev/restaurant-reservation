import contactBackgroundImage from '../assets/contact-background.jpg';

const fallbackRestaurantInfo = {
  phone: '+212 522 49 16 16',
  email: 'contact@pfm.ma',
  address: 'Boulevard de la Corniche, Casablanca',
  openingHours: 'Ouvert tous les jours de 09:00 a 18:00'
};

export default function ContactPage({ t, restaurantInfo, siteImages, contactForm, setContactForm, submitContact, contactStatus }) {
  const info = { ...fallbackRestaurantInfo, ...(restaurantInfo || {}) };
  const panelBackground = String(siteImages?.contactBackground || '').trim() || contactBackgroundImage;

  return (
    <section className="container py-5 reveal-on-scroll">
      <div className="contact-creative-shell">
        <article className="contact-hero-panel" style={{ backgroundImage: `url('${panelBackground}')` }}>
          <div className="contact-hero-overlay" />
          <div className="contact-hero-content">
            <div className="contact-quick-list">
              <span>{info.phone}</span>
              <span>{info.email}</span>
              <span>{info.address}</span>
              <span>{info.openingHours}</span>
            </div>
          </div>
        </article>

        <form className="reservation-box contact-form-card" onSubmit={submitContact}>
          <h3 className="mb-3">{t.app.contactFormTitle}</h3>
          <div className="row g-3">
            <div className="col-12">
              <input
                className="form-control"
                placeholder={t.app.fullNameRequired}
                value={contactForm.name}
                onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                type="email"
                placeholder={t.app.emailRequired}
                value={contactForm.email}
                onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder={t.app.phonePlaceholder}
                value={contactForm.phone}
                onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="col-12">
              <textarea
                className="form-control"
                rows="5"
                placeholder={t.app.messageRequired}
                value={contactForm.message}
                onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-warning mt-3" type="submit">{t.app.sendLabel}</button>
          {contactStatus.text && <div className={`alert alert-${contactStatus.type} mt-3 mb-0`}>{contactStatus.text}</div>}
        </form>
      </div>
    </section>
  );
}
