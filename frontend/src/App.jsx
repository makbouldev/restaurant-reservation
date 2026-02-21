import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_LANG, LANGUAGE_STORAGE_KEY, replaceParam, translations } from './i18n';
import CreativeNavbar from './components/CreativeNavbar';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ServicesPage from './pages/ServicesPage';
import OffersPage from './pages/OffersPage';
import AmbiancePage from './pages/AmbiancePage';
import ReservationPage from './pages/ReservationPage';
import ContactPage from './pages/ContactPage';
import siteLogoAsset from './assets/site-logo.png';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/+$/, '');
const ADMIN_TOKEN_KEY = 'neonbite_admin_token';
const ALL_KEY = '__all__';
const SPECIAL_OFFERS_CATEGORY = 'Offres speciales';
const GOOGLE_TRANSLATE_CONTAINER_ID = 'google_translate_element';
const PUBLIC_CACHE_TTL_MS = 2 * 60 * 1000;
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));

function toGoogleMapsLink(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
}

function loadGoogleTranslateElement() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();
  if (window.__googleTranslateLoaderPromise) return window.__googleTranslateLoaderPromise;

  window.__googleTranslateLoaderPromise = new Promise((resolve) => {
    const scriptId = 'google-translate-script';
    if (document.getElementById(scriptId)) {
      resolve();
      return;
    }

    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'fr',
            includedLanguages: 'fr,en,ar',
            autoDisplay: false
          },
          GOOGLE_TRANSLATE_CONTAINER_ID
        );
      } catch (error) {
        // Ignore translator init errors and keep app usable.
      }
      resolve();
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });

  return window.__googleTranslateLoaderPromise;
}

function applyGoogleTranslateLanguage(nextLang) {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;
  const normalized = nextLang === 'ar' ? 'ar' : nextLang === 'en' ? 'en' : 'fr';
  if (combo.value !== normalized) {
    combo.value = normalized;
    combo.dispatchEvent(new Event('change'));
  }
  return true;
}

function toGoogleMapsEmbedUrl(value, fallbackEmbedUrl) {
  const raw = String(value || '').trim();
  if (!raw) return fallbackEmbedUrl;
  if (raw.includes('output=embed')) return raw;

  const fallbackQuery = `https://www.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`;
  try {
    const parsed = new URL(raw);
    const readParam = (...keys) => {
      for (const key of keys) {
        const next = parsed.searchParams.get(key);
        if (next && String(next).trim()) return String(next).trim();
      }
      return '';
    };
    const qParam = readParam('q', 'query', 'destination', 'll');
    if (qParam) {
      return `https://www.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed`;
    }

    const atMatch = parsed.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return `https://www.google.com/maps?q=${encodeURIComponent(`${atMatch[1]},${atMatch[2]}`)}&output=embed`;
    }

    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/i);
    if (placeMatch && placeMatch[1]) {
      const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    const searchMatch = parsed.pathname.match(/\/search\/([^/]+)/i);
    if (searchMatch && searchMatch[1]) {
      const search = decodeURIComponent(searchMatch[1]).replace(/\+/g, ' ');
      return `https://www.google.com/maps?q=${encodeURIComponent(search)}&output=embed`;
    }
  } catch (error) {
    return fallbackQuery;
  }

  return fallbackQuery;
}

const defaultGalleryImages = [
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'
];
const defaultRestaurantInfo = {
  restaurantName: 'Laplage',
  phone: '+212 522 49 16 16',
  whatsappPhone: '212522207111',
  email: 'contact@pfm.ma',
  address: 'Boulevard de la Corniche, Casablanca',
  openingHours: 'Ouvert tous les jours de 09:00 a 18:00',
  mapUrl: 'https://maps.google.com/?q=Boulevard+de+la+Corniche+Casablanca',
  mapEmbedUrl: 'https://www.google.com/maps?q=Boulevard%20de%20la%20Corniche%20Casablanca&output=embed',
  heroKicker: 'Service {{restaurantName}}',
  heroTitle: 'Accompagnement et services funeraires de confiance',
  heroText: 'Une equipe disponible pour vous accompagner avec discretion, ecoute et organisation complete.',
  contactHeadline: 'Contactez notre equipe',
  contactDescription: 'Nous restons disponibles pour toute demande d information ou assistance immediate.',
  footerNote: 'Un accompagnement humain et professionnel, 7j/7.'
};
const defaultSiteImages = {
  heroBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80',
  reservationPanelBackground: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  contactBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1500&q=80'
};

const classicServicesData = [
  {
    kicker: 'Diner prive',
    title: 'Table privee haut de gamme',
    text: 'Un espace reserve pour anniversaires, rendez-vous et soirees exclusives.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Evenements entreprise',
    title: 'Evenements entreprise',
    text: 'Menus adaptes, accueil VIP et coordination complete pour vos equipes.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Experience chef',
    title: 'Cuisine en direct',
    text: 'Experience immersive avec chef en direct et presentation artistique des plats.',
    image: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Packs anniversaire',
    title: 'Packs anniversaire',
    text: 'Decoration, dessert signature et playlist personnalisee pour votre celebration.',
    image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Livraison haut de gamme',
    title: 'Livraison soignee',
    text: 'Conditionnement elegant et rapide pour garder saveur, style et qualite.',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Coins mariage',
    title: 'Espaces mariage',
    text: 'Mini corners culinaires modernes pour cocktails de mariage et receptions.',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80'
  }
];

const specialOffersData = [
  {
    kicker: 'Eclat anniversaire',
    title: 'Forfait anniversaire haut de gamme',
    text: 'Gateau signature, mise en scene lumineuse et coin photo dedie.',
    badge: '-15% groupe 6+',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Soiree duo',
    title: 'Diner duo signature',
    text: 'Menu 3 services, cocktail sans alcool duo et table romantique reservee.',
    badge: 'Edition soiree',
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Dimanche famille',
    title: 'Offre famille week-end',
    text: 'Menus enfants, plateau partage et dessert offert pour 4 personnes.',
    badge: 'Tous les dimanches',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Soiree equipe',
    title: 'Forfait entreprise',
    text: 'Tarif groupe, espace semi-prive et service accelere pour equipes.',
    badge: 'Sur reservation',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Moments Ramadan',
    title: 'Experience ftour',
    text: 'Menu ftour complet avec ambiance detendue et selection maison.',
    badge: 'Saisonnier',
    image: 'https://images.unsplash.com/photo-1514516816566-de580c621376?auto=format&fit=crop&w=1200&q=80'
  },
  {
    kicker: 'Apres-travail',
    title: 'Accords amuse-bouches et boissons',
    text: 'Assiettes d amuse-bouches et boissons a prix doux entre 17h et 20h.',
    badge: 'Du lundi au jeudi',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
  }
];

const publicRoutes = ['/', '/menu', '/services', '/services-classiques', '/offres-speciales', '/ambiance', '/reservation', '/contact'];

function FloatingQuickActions({ t, restaurantInfo }) {
  const phoneHref = String(restaurantInfo?.phone || '').replace(/\s+/g, '');
  const whatsappHref = String(restaurantInfo?.whatsappPhone || '').replace(/[^\d]/g, '');
  return (
    <div className="floating-dock" aria-label={t.app.quickActionsLabel}>
      <div className="floating-dock-side floating-dock-left">
        <a
          className="floating-action wa"
          href={`https://wa.me/${whatsappHref || '212612345678'}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t.app.whatsappLabel}
        >
          <span className="floating-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="floating-svg">
              <path d="M20 12a8 8 0 0 1-11.75 7.05L4 20l1-4.12A8 8 0 1 1 20 12Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 10c.2 1.2 2.2 3.2 3.4 3.4.4.1.9 0 1.2-.3l.8-.8 1.5.9-.4 1.1c-.2.6-.8 1-1.4 1-2.8 0-5.4-2.6-5.4-5.4 0-.6.4-1.2 1-1.4l1.1-.4.9 1.5-.8.8c-.3.3-.4.8-.3 1.2Z" fill="currentColor" />
            </svg>
          </span>
          <span className="floating-text">{t.app.whatsappLabel}</span>
        </a>
        <a className="floating-action call" href={`tel:${phoneHref || '+212612345678'}`} aria-label={t.app.callLabel}>
          <span className="floating-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="floating-svg">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.2 19.2 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2L8.2 9.5a16 16 0 0 0 6.3 6.3l1.2-1.2a2 2 0 0 1 2-.4c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="floating-text">{t.app.callLabel}</span>
        </a>
      </div>
      <div className="floating-dock-side floating-dock-right">
        <Link className="floating-action reserve" to="/reservation" aria-label={t.app.reserveTable}>
          <span className="floating-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="floating-svg">
              <path d="M8 2v3M16 2v3M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="floating-text">{t.app.reserveTable}</span>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState(ALL_KEY);
  const [commentForm, setCommentForm] = useState({ name: '', rating: 5, text: '' });
  const [comments, setComments] = useState([]);
  const [activeCommentIndex, setActiveCommentIndex] = useState(0);
  const [commentShiftClass, setCommentShiftClass] = useState('');
  const [commentStatus, setCommentStatus] = useState({ type: '', text: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ type: '', text: '' });
  const [siteLogoPath] = useState(siteLogoAsset);
  const [siteLogoSize] = useState(64);
  const [siteBrandName] = useState('Laplage');
  const [siteBrandNameVisible] = useState(true);
  const [restaurantInfo, setRestaurantInfo] = useState(defaultRestaurantInfo);
  const [siteImages, setSiteImages] = useState({ heroBackground: '', reservationPanelBackground: '', contactBackground: '' });
  const [galleryImages, setGalleryImages] = useState([]);
  const [classicServices, setClassicServices] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const commentAnimTimerRef = useRef(null);
  const commentWheelLockRef = useRef(0);
  const publicDataCacheRef = useRef(new Map());
  const publicDataInFlightRef = useRef(new Map());
  const publicDataBootstrappedRef = useRef(false);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLang && translations[savedLang] ? savedLang : DEFAULT_LANG;
  });

  const t = translations[lang] || translations[DEFAULT_LANG];
  const whatsappHref = String(restaurantInfo?.whatsappPhone || '').replace(/[^\d]/g, '');
  const restaurantName = useMemo(() => {
    return String(restaurantInfo?.restaurantName || '').trim();
  }, [restaurantInfo?.restaurantName]);
  const withRestaurantName = useCallback(
    (template) => replaceParam(String(template || ''), 'restaurantName', restaurantName),
    [restaurantName]
  );
  const heroKickerText = useMemo(
    () => withRestaurantName(restaurantInfo?.heroKicker || t.app.heroKicker),
    [withRestaurantName, restaurantInfo?.heroKicker, t.app.heroKicker]
  );
  const heroTitleText = useMemo(
    () => withRestaurantName(restaurantInfo?.heroTitle || t.app.heroTitle),
    [withRestaurantName, restaurantInfo?.heroTitle, t.app.heroTitle]
  );
  const heroDescriptionText = useMemo(
    () => withRestaurantName(restaurantInfo?.heroText || t.app.heroText),
    [withRestaurantName, restaurantInfo?.heroText, t.app.heroText]
  );

  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isAdminPath = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');
  const adminSection = isAdminPath ? normalizedPath.replace('/admin', '').replace(/^\/+/, '') || 'dashboard' : '';
  const currentRoute = publicRoutes.includes(normalizedPath) ? normalizedPath : '/';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const [adminToken, setAdminToken] = useState(
    isAdminPath ? localStorage.getItem(ADMIN_TOKEN_KEY) || '' : ''
  );
  const [checkingAdminAuth, setCheckingAdminAuth] = useState(isAdminPath);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  useEffect(() => {
    let cancelled = false;
    const hasTranslateCombo = Boolean(document.querySelector('.goog-te-combo'));
    if (lang === 'fr' && !hasTranslateCombo) return undefined;

    const syncGoogleTranslate = async () => {
      await loadGoogleTranslateElement();
      if (cancelled) return;

      let tries = 0;
      const maxTries = 25;
      const timer = window.setInterval(() => {
        tries += 1;
        const applied = applyGoogleTranslateLanguage(lang);
        if (applied || tries >= maxTries || cancelled) {
          window.clearInterval(timer);
        }
      }, 120);
    };

    syncGoogleTranslate();
    return () => {
      cancelled = true;
    };
  }, [lang, currentRoute]);

  useEffect(() => {
    document.title = restaurantName ? `${restaurantName} | ${t.app.siteTitleSuffix}` : t.app.siteTitleSuffix;
  }, [restaurantName, t.app.siteTitleSuffix]);

  useEffect(() => {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    const logoHref = String(siteLogoPath || '').trim();
    let linkEl = document.querySelector('link[data-dynamic-favicon="true"]');

    if (!logoHref) {
      if (linkEl) linkEl.remove();
      return;
    }

    const separator = logoHref.includes('?') ? '&' : '?';
    const faviconHref = `${logoHref}${separator}v=${Date.now()}`;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'icon');
      linkEl.setAttribute('data-dynamic-favicon', 'true');
      head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', faviconHref);
  }, [siteLogoPath]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('.reveal-on-scroll'));
    targets.forEach((el) => el.classList.add('is-visible'));
    return undefined;
  }, [currentRoute, lang, menu.length, galleryImages.length, specialOffers.length, classicServices.length, comments.length, activeCategory]);

  const loadClientData = useCallback(async (scope = { settings: true, menu: true, comments: true, gallery: false }, options = {}) => {
    const forceRefresh = Boolean(options.forceRefresh);
    const shouldLoadSettings = Boolean(scope.settings);
    const shouldLoadMenu = Boolean(scope.menu);
    const shouldLoadComments = Boolean(scope.comments);
    const shouldLoadGallery = Boolean(scope.gallery);

    const loadJsonWithCache = async (cacheKey, url) => {
      const now = Date.now();
      const cached = publicDataCacheRef.current.get(cacheKey);
      if (!forceRefresh && cached && now - cached.ts <= PUBLIC_CACHE_TTL_MS) {
        return cached.data;
      }

      if (!forceRefresh) {
        const inFlight = publicDataInFlightRef.current.get(cacheKey);
        if (inFlight) return inFlight;
      }

      const requestPromise = (async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Public API request failed.');
        }

        const data = await response.json();
        publicDataCacheRef.current.set(cacheKey, { data, ts: now });
        return data;
      })().finally(() => {
        publicDataInFlightRef.current.delete(cacheKey);
      });

      publicDataInFlightRef.current.set(cacheKey, requestPromise);
      return requestPromise;
    };

    const requestTasks = [];
    if (shouldLoadSettings) requestTasks.push(loadJsonWithCache('settings', `${API_BASE}/settings/public`).then((data) => ['settings', data]));
    if (shouldLoadMenu) requestTasks.push(loadJsonWithCache('menu', `${API_BASE}/menu`).then((data) => ['menu', data]));
    if (shouldLoadComments) requestTasks.push(loadJsonWithCache('comments', `${API_BASE}/comments`).then((data) => ['comments', data]));
    if (shouldLoadGallery) requestTasks.push(loadJsonWithCache('gallery', `${API_BASE}/gallery`).then((data) => ['gallery', data]));

    const resolvedEntries = await Promise.all(requestTasks);
    const resolvedData = Object.fromEntries(resolvedEntries);
    const settingsData = resolvedData.settings;
    const menuData = resolvedData.menu;
    const commentsData = resolvedData.comments;
    const galleryData = resolvedData.gallery;
    const normalizePublicAsset = (assetPath) => (
      assetPath && String(assetPath).startsWith('/uploads/')
        ? `${API_BASE.replace('/api', '')}${assetPath}`
        : assetPath
    );
    const normalizeRestaurantInfo = (info) => {
      const merged = { ...defaultRestaurantInfo, ...(info && typeof info === 'object' ? info : {}) };
      const mapUrl = toGoogleMapsLink(merged.mapUrl);
      return {
        ...merged,
        restaurantName: String(merged.restaurantName || defaultRestaurantInfo.restaurantName),
        phone: String(merged.phone || ''),
        whatsappPhone: String(merged.whatsappPhone || '').replace(/[^\d]/g, ''),
        email: String(merged.email || ''),
        address: String(merged.address || ''),
        openingHours: String(merged.openingHours || ''),
        mapUrl,
        mapEmbedUrl: toGoogleMapsEmbedUrl(mapUrl, defaultRestaurantInfo.mapEmbedUrl),
        heroKicker: String(merged.heroKicker || ''),
        heroTitle: String(merged.heroTitle || ''),
        heroText: String(merged.heroText || ''),
        contactHeadline: String(merged.contactHeadline || ''),
        contactDescription: String(merged.contactDescription || ''),
        footerNote: String(merged.footerNote || '')
      };
    };
    const normalizeSiteImages = (images) => {
      const merged = { ...defaultSiteImages, ...(images && typeof images === 'object' ? images : {}) };
      return {
        heroBackground: normalizePublicAsset(String(merged.heroBackground || defaultSiteImages.heroBackground)),
        reservationPanelBackground: normalizePublicAsset(String(merged.reservationPanelBackground || defaultSiteImages.reservationPanelBackground)),
        contactBackground: normalizePublicAsset(String(merged.contactBackground || defaultSiteImages.contactBackground))
      };
    };
    const normalizeServiceCards = (items, fallback, withBadge = false) => {
      if (!Array.isArray(items) || !items.length) return fallback;
      const normalized = items
        .slice(0, 12)
        .map((item) => {
          const next = {
            kicker: String(item?.kicker || '').trim(),
            title: String(item?.title || '').trim(),
            text: String(item?.text || '').trim(),
            image: normalizePublicAsset(String(item?.image || '').trim())
          };
          if (withBadge) next.badge = String(item?.badge || '').trim();
          return next;
        })
        .filter((item) => item.kicker && item.title && item.text && item.image);
      return normalized.length ? normalized : fallback;
    };

    if (shouldLoadMenu) {
      const apiHost = API_BASE.replace('/api', '');
      const normalizedMenu = (Array.isArray(menuData) ? menuData : []).map((item) => {
        const normalize = (image) => (image && image.startsWith('/uploads/') ? `${apiHost}${image}` : image);
        const images = Array.isArray(item.images) ? item.images.map(normalize) : [];
        return {
          ...item,
          image: normalize(item.image),
          images
        };
      });
      setMenu(normalizedMenu);
    }

    if (shouldLoadComments) {
      setComments(Array.isArray(commentsData) ? commentsData : []);
    }

    if (shouldLoadSettings && settingsData) {
      setSiteImages(normalizeSiteImages(settingsData?.siteImages));
      const settingsGallery = Array.isArray(settingsData?.galleryImages) && settingsData.galleryImages.length > 0
        ? settingsData.galleryImages.map((imagePath) => normalizePublicAsset(imagePath)).filter(Boolean)
        : defaultGalleryImages;
      setGalleryImages(settingsGallery);
      setClassicServices(normalizeServiceCards(settingsData?.classicServices, classicServicesData));
      setSpecialOffers(normalizeServiceCards(settingsData?.specialOffers, specialOffersData, true));
    }

    if (shouldLoadGallery) {
      const normalizedGallery = Array.isArray(galleryData) && galleryData.length > 0
        ? galleryData
          .map((item) => normalizePublicAsset(String(item?.imagePath || item?.image_path || '')))
          .filter(Boolean)
        : [];
      if (normalizedGallery.length > 0) {
        setGalleryImages(normalizedGallery);
      }
    }
  }, []);

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentStatus({ type: '', text: '' });
    const name = commentForm.name.trim();
    const text = commentForm.text.trim();
    const rating = Number(commentForm.rating);
    if (!name || !text || rating < 1 || rating > 5) return;

    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, text })
      });
      const data = await response.json();

      if (!response.ok) {
        setCommentStatus({ type: 'danger', text: data.message || t.app.commentSendFail });
        return;
      }

      setCommentForm({ name: '', rating: 5, text: '' });
      setCommentStatus({ type: 'success', text: t.app.commentSendSuccess });
    } catch (error) {
      setCommentStatus({ type: 'danger', text: t.app.networkRetry });
    }
  };

  const submitContact = async (event) => {
    event.preventDefault();
    setContactStatus({ type: '', text: '' });
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const phone = contactForm.phone.trim();
    const message = contactForm.message.trim();

    if (!name || !email || !message) {
      setContactStatus({ type: 'danger', text: t.app.contactRequiredFields });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });
      const data = await response.json();

      if (!response.ok) {
        setContactStatus({ type: 'danger', text: data.message || t.app.contactSendFail });
        return;
      }

      setContactStatus({ type: 'success', text: t.app.contactSendSuccess });
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setContactStatus({ type: 'danger', text: t.app.networkRetry });
    }
  };

  useEffect(() => {
    if (isAdminPath) return;
    let ignore = false;
    const needsHomeData = currentRoute === '/';
    const needsMenuData = currentRoute === '/menu';
    const hasBootstrapped = publicDataBootstrappedRef.current;

    loadClientData({
      settings: !hasBootstrapped,
      menu: (needsHomeData || needsMenuData) && (!hasBootstrapped || menu.length === 0),
      comments: needsHomeData && (!hasBootstrapped || comments.length === 0),
      gallery: currentRoute === '/ambiance' && galleryImages.length === 0
    })
      .catch(() => {
        if (ignore) return;
      })
      .finally(() => {
        if (ignore) return;
        publicDataBootstrappedRef.current = true;
      });

    return () => {
      ignore = true;
    };
  }, [isAdminPath, currentRoute, loadClientData, menu.length, comments.length, galleryImages.length]);

  useEffect(() => {
    if (!isAdminPath) return;
    if (!adminToken) {
      setCheckingAdminAuth(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/verify`, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken('');
        }
      } catch (error) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdminToken('');
      } finally {
        setCheckingAdminAuth(false);
      }
    };

    verify();
  }, [isAdminPath, adminToken]);

  const normalizeCategory = useCallback((value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === '3orod khasa') return 'offres speciales';
    return normalized;
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(
      menu
        .map((item) => {
          const raw = String(item.category || '').trim();
          return normalizeCategory(raw) === 'offres speciales' ? SPECIAL_OFFERS_CATEGORY : raw;
        })
        .filter((value) => value.length > 0)
    );
    unique.add(SPECIAL_OFFERS_CATEGORY);
    return [ALL_KEY, ...Array.from(unique)];
  }, [menu, normalizeCategory]);

  const filteredMenu = useMemo(() => {
    if (activeCategory === ALL_KEY) return menu;
    const selected = normalizeCategory(activeCategory);
    return menu.filter((item) => normalizeCategory(item.category) === selected);
  }, [activeCategory, menu, normalizeCategory]);

  const categoryMeta = useMemo(() => (
    categories.map((category) => {
      if (category === ALL_KEY) {
        return { category, count: menu.length };
      }
      const selected = normalizeCategory(category);
      const count = menu.filter((item) => normalizeCategory(item.category) === selected).length;
      return { category, count };
    })
  ), [categories, menu, normalizeCategory]);

  useEffect(() => {
    if (activeCategory === ALL_KEY) return;
    const exists = categories.some((category) => normalizeCategory(category) === normalizeCategory(activeCategory));
    if (!exists) {
      setActiveCategory(ALL_KEY);
    }
  }, [activeCategory, categories, normalizeCategory]);

  useEffect(() => {
    if (!comments.length) {
      setActiveCommentIndex(0);
      return;
    }
    setActiveCommentIndex((prev) => (prev >= comments.length ? 0 : prev));
  }, [comments]);

  const activeComment = comments.length ? comments[activeCommentIndex] : null;

  const triggerCommentAnimation = (direction) => {
    if (commentAnimTimerRef.current) {
      clearTimeout(commentAnimTimerRef.current);
      commentAnimTimerRef.current = null;
    }
    const nextClass = direction === 'prev' ? 'is-shift-prev' : 'is-shift-next';
    setCommentShiftClass(nextClass);
    commentAnimTimerRef.current = setTimeout(() => {
      setCommentShiftClass('');
      commentAnimTimerRef.current = null;
    }, 420);
  };

  const goToNextComment = () => {
    if (comments.length < 2) return;
    triggerCommentAnimation('next');
    setActiveCommentIndex((prev) => (prev + 1) % comments.length);
  };

  const goToPrevComment = () => {
    if (comments.length < 2) return;
    triggerCommentAnimation('prev');
    setActiveCommentIndex((prev) => (prev - 1 + comments.length) % comments.length);
  };

  const handleCommentWheel = (event) => {
    if (comments.length < 2) return;
    const delta = Number(event.deltaY) || 0;
    if (Math.abs(delta) < 8) return;
    const now = Date.now();
    if (now - commentWheelLockRef.current < 420) return;
    commentWheelLockRef.current = now;
    event.preventDefault();
    if (delta > 0) goToNextComment();
    else goToPrevComment();
  };

  useEffect(() => () => {
    if (commentAnimTimerRef.current) {
      clearTimeout(commentAnimTimerRef.current);
    }
  }, []);

  const handleAdminLogin = (token) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminToken(token);
    setCheckingAdminAuth(false);
  };

  const handleAdminLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
    } catch (error) {
      // Ignore network errors on logout.
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken('');
    navigate('/');
  };

  const renderCommentStars = (ratingValue) => {
    const rating = Math.max(1, Math.min(5, Number(ratingValue) || 5));
    return (
      <span className="comment-stars" aria-label={`${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'is-on' : ''}>&#9733;</span>
        ))}
      </span>
    );
  };

  const routeViews = useMemo(() => ({
    '/': (
      <HomePage
        t={t}
        restaurantName={restaurantName}
        heroKickerText={heroKickerText}
        heroTitleText={heroTitleText}
        heroDescriptionText={heroDescriptionText}
        specialOffers={specialOffers}
        menu={menu}
        comments={comments}
        activeComment={activeComment}
        commentShiftClass={commentShiftClass}
        handleCommentWheel={handleCommentWheel}
        renderCommentStars={renderCommentStars}
        activeCommentIndex={activeCommentIndex}
        goToPrevComment={goToPrevComment}
        goToNextComment={goToNextComment}
        commentForm={commentForm}
        setCommentForm={setCommentForm}
        commentStatus={commentStatus}
        submitComment={submitComment}
        restaurantInfo={restaurantInfo}
        apiBase={API_BASE}
      />
    ),
    '/menu': (
      <MenuPage
        t={t}
        filteredMenu={filteredMenu}
        categoryMeta={categoryMeta}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        allKey={ALL_KEY}
      />
    ),
    '/services': <ServicesPage t={t} classicServices={classicServices} />,
    '/services-classiques': <ServicesPage t={t} classicServices={classicServices} />,
    '/offres-speciales': <OffersPage t={t} specialOffers={specialOffers} />,
    '/ambiance': <AmbiancePage t={t} galleryImages={galleryImages} restaurantInfo={restaurantInfo} />,
    '/reservation': <ReservationPage t={t} apiBase={API_BASE} />,
    '/contact': (
      <ContactPage
        t={t}
        restaurantInfo={restaurantInfo}
        siteImages={siteImages}
        contactForm={contactForm}
        setContactForm={setContactForm}
        submitContact={submitContact}
        contactStatus={contactStatus}
      />
    )
  }), [
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
    activeCommentIndex,
    goToPrevComment,
    goToNextComment,
    commentForm,
    commentStatus,
    submitComment,
    restaurantInfo,
    filteredMenu,
    categoryMeta,
    activeCategory,
    classicServices,
    galleryImages,
    siteImages,
    contactForm,
    setContactForm,
    submitContact,
    contactStatus
  ]);
  const pageContent = routeViews[currentRoute] || routeViews['/'];

  const translateMount = <div id={GOOGLE_TRANSLATE_CONTAINER_ID} aria-hidden="true" />;

  if (isAdminPath) {
    if (checkingAdminAuth) {
      return (
        <>
          {translateMount}
          <section className="container py-5">
            <div className="reservation-box">{t.app.checkingAdmin}</div>
          </section>
        </>
      );
    }

    if (!adminToken) {
      return (
        <>
          {translateMount}
          <Suspense fallback={<section className="container py-5"><div className="reservation-box">{t.app.loadingData}</div></section>}>
            <AdminLogin apiBase={API_BASE} onLogin={handleAdminLogin} t={t} />
          </Suspense>
        </>
      );
    }

    return (
      <>
        {translateMount}
        <Suspense fallback={<section className="container py-5"><div className="reservation-box">{t.app.loadingData}</div></section>}>
          <div>
            <AdminPanel
              apiBase={API_BASE}
              onDataChanged={loadClientData}
              adminToken={adminToken}
              t={t}
              onLogout={handleAdminLogout}
              adminSection={adminSection}
            />
          </div>
        </Suspense>
      </>
    );
  }

  return (
    <div className={`app-shell ${currentRoute === '/' ? 'route-home' : 'route-inner'}`}>
      {translateMount}
      <CreativeNavbar
        currentRoute={currentRoute}
        lang={lang}
        setLang={setLang}
        t={t}
        logoPath={siteLogoPath}
        logoSize={siteLogoSize}
        brandName={siteBrandName}
        brandNameVisible={siteBrandNameVisible}
        restaurantName={restaurantName}
        restaurantInfo={restaurantInfo}
      />
      {pageContent}

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>{restaurantInfo.restaurantName}</h3>
              <p>{restaurantInfo.openingHours}</p>
              <div className="footer-pills">
                <span>{t.app.footerLiveKitchen}</span>
                <span>{t.app.footerStreetFood}</span>
                <span>{restaurantInfo.address}</span>
              </div>
            </div>

            <div className="footer-col">
              <h4>{t.app.footerNavTitle}</h4>
              <Link to="/">{t.nav.home}</Link>
              <Link to="/menu">{t.nav.menu}</Link>
              <Link to="/services-classiques">{t.nav.classicServices}</Link>
              <Link to="/offres-speciales">{t.nav.specialOffers}</Link>
              <Link to="/ambiance">{t.nav.ambiance}</Link>
              <Link to="/reservation">{t.nav.reservation}</Link>
              <Link to="/contact">{t.nav.contact}</Link>
            </div>

            <div className="footer-col">
              <h4>{t.app.footerContactTitle}</h4>
              <p>{restaurantInfo.address}</p>
              <p>{restaurantInfo.phone}</p>
              <p>{restaurantInfo.email}</p>
              <div className="footer-socials" aria-label="Social media">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-link is-facebook" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" className="footer-social-icon" aria-hidden="true">
                    <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h3l1-3h-4V9a1 1 0 0 1 1-1Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-link is-instagram" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" className="footer-social-icon" aria-hidden="true">
                    <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5Zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5Zm5-3.2a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 17 7.3Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link is-linkedin" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" className="footer-social-icon" aria-hidden="true">
                    <path d="M6.7 8.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6ZM5 10h3.3v9H5v-9Zm5.3 0h3.1v1.3h.1c.4-.8 1.5-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V19H17v-4.1c0-1 0-2.2-1.3-2.2s-1.6 1-1.6 2.1V19h-3.8v-9Z" fill="currentColor" />
                  </svg>
                </a>
                <a href={`https://wa.me/${whatsappHref || '212612345678'}`} target="_blank" rel="noreferrer" className="footer-social-link is-whatsapp" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" className="footer-social-icon" aria-hidden="true">
                    <path d="M20 12a8 8 0 0 1-11.7 7l-4.3 1 1-4.1A8 8 0 1 1 20 12Zm-6.1 1.7-.8.8c-.3.3-.7.4-1.1.3-1.2-.2-3.1-2.1-3.3-3.3-.1-.4 0-.8.3-1.1l.8-.8-.9-1.4-1 .4c-.6.2-1 .8-1 1.4 0 2.7 2.5 5.2 5.2 5.2.6 0 1.2-.4 1.4-1l.4-1-.9-1.4Z" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-cta">
              <h4>{t.app.footerReadyTonight}</h4>
              <p>{restaurantInfo.footerNote}</p>
              <Link to="/reservation" className="btn btn-warning footer-cta-btn">
                {t.app.reserveTable}
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {restaurantInfo.restaurantName}</span>
            <span>{t.app.footerDesigned}</span>
          </div>
        </div>
      </footer>
      <FloatingQuickActions t={t} restaurantInfo={restaurantInfo} />
    </div>
  );
}
