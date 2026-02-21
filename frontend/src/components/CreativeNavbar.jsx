import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CreativeNavbar({ currentRoute, lang, setLang, t, logoPath, logoSize, brandName, brandNameVisible, restaurantName, restaurantInfo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);
  const navItems = [
    { path: '/', label: t.nav.home, hint: t.nav.homeHint },
    { path: '/menu', label: t.nav.menu, hint: t.nav.menuHint },
    { path: '/ambiance', label: t.nav.ambiance, hint: t.nav.ambianceHint },
    { path: '/reservation', label: t.nav.reservation, hint: t.nav.reservationHint }
  ];
  const isServicesActive = currentRoute === '/services' || currentRoute === '/services-classiques' || currentRoute === '/offres-speciales';
  const brandTitle = brandNameVisible && String(brandName || '').trim() ? brandName : (restaurantName || 'PFM');
  const brandSubtitle = 'Saveur Style Passion';

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [currentRoute, lang]);

  useEffect(() => {
    const syncNavOffset = () => {
      if (!navRef.current) return;
      const navHeight = Math.ceil(navRef.current.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--nav-offset', `${navHeight + 8}px`);
    };

    syncNavOffset();
    window.addEventListener('resize', syncNavOffset);
    return () => window.removeEventListener('resize', syncNavOffset);
  }, [menuOpen, servicesOpen, currentRoute, lang, isScrolled]);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`creative-nav ${isScrolled ? 'is-scrolled' : ''}`} ref={navRef}>
      <div className="container">
        <div className="creative-nav-shell">
          <div className="creative-nav-top-row">
            <Link to="/" className="brand-mark">
              {logoPath ? (
                <img
                  src={logoPath}
                  alt={`${restaurantName} logo`}
                  className="brand-logo"
                  style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
                />
              ) : null}
              <span className="brand-copy">
                <strong>{brandTitle}</strong>
                <small>{brandSubtitle}</small>
              </span>
            </Link>

            <div className="creative-nav-meta">
              <div className="creative-nav-socials" aria-label="Social media">
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" className="creative-nav-social-icon" aria-hidden="true">
                    <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h3l1-3h-4V9a1 1 0 0 1 1-1Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" className="creative-nav-social-icon" aria-hidden="true">
                    <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5Zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5Zm5-3.2a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 17 7.3Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" className="creative-nav-social-icon" aria-hidden="true">
                    <path d="M6.7 8.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6ZM5 10h3.3v9H5v-9Zm5.3 0h3.1v1.3h.1c.4-.8 1.5-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V19H17v-4.1c0-1 0-2.2-1.3-2.2s-1.6 1-1.6 2.1V19h-3.8v-9Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" className="creative-nav-social-icon" aria-hidden="true">
                    <path d="M20 12a8 8 0 0 1-11.7 7l-4.3 1 1-4.1A8 8 0 1 1 20 12Zm-6.1 1.7-.8.8c-.3.3-.7.4-1.1.3-1.2-.2-3.1-2.1-3.3-3.3-.1-.4 0-.8.3-1.1l.8-.8-.9-1.4-1 .4c-.6.2-1 .8-1 1.4 0 2.7 2.5 5.2 5.2 5.2.6 0 1.2-.4 1.4-1l.4-1-.9-1.4Z" fill="currentColor" />
                  </svg>
                </a>
              </div>
              <div className="lang-switch" aria-label={t.nav.languages}>
                <button
                  type="button"
                  className={`lang-switch-btn ${lang === 'fr' ? 'is-active' : ''}`}
                  onClick={() => setLang('fr')}
                >
                  FR
                </button>
                <button
                  type="button"
                  className={`lang-switch-btn ${lang === 'en' ? 'is-active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-switch-btn ${lang === 'ar' ? 'is-active' : ''}`}
                  onClick={() => setLang('ar')}
                >
                  AR
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`creative-nav-toggle ${menuOpen ? 'is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-label={t.app.navToggleLabel}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`creative-nav-main-row ${menuOpen ? 'is-open' : ''}`}>
            <div className="creative-nav-lang-mobile" aria-label={t.nav.languages}>
              <button
                type="button"
                className={`lang-switch-btn ${lang === 'fr' ? 'is-active' : ''}`}
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                type="button"
                className={`lang-switch-btn ${lang === 'en' ? 'is-active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-switch-btn ${lang === 'ar' ? 'is-active' : ''}`}
                onClick={() => setLang('ar')}
              >
                AR
              </button>
            </div>

            <div className="creative-nav-links">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`creative-nav-link ${currentRoute === item.path ? 'is-active' : ''}`}
                >
                  <span className="creative-nav-label">{item.label}</span>
                </Link>
              ))}
              <div className={`creative-nav-group ${isServicesActive ? 'is-active' : ''} ${servicesOpen ? 'is-open' : ''}`}>
                <button type="button" className="creative-nav-group-btn" onClick={() => setServicesOpen((prev) => !prev)}>
                  <span className="creative-nav-label">{t.nav.servicesGroup}</span>
                </button>
                <div className="creative-nav-submenu">
                  <Link to="/services-classiques" className={currentRoute === '/services-classiques' || currentRoute === '/services' ? 'is-active' : ''}>
                    {t.nav.classicServices}
                  </Link>
                  <Link to="/offres-speciales" className={currentRoute === '/offres-speciales' ? 'is-active' : ''}>
                    {t.nav.specialOffers}
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/contact" className="creative-nav-cta">
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
