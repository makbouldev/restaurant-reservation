import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { replaceParam } from '../i18n';

const defaultPlate = {
  name: '',
  description: '',
  category: '',
  price: ''
};
const DEFAULT_CLASSIC_SERVICES = [
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
  }
];
const DEFAULT_SPECIAL_OFFERS = [
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
    kicker: 'Apres-travail',
    title: 'Accords amuse-bouches et boissons',
    text: 'Assiettes d amuse-bouches et boissons a prix doux entre 17h et 20h.',
    badge: 'Du lundi au jeudi',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
  }
];
const DEFAULT_RESTAURANT_INFO = {
  restaurantName: 'NeonBite',
  phone: '+212 6 12 34 56 78',
  whatsappPhone: '212612345678',
  email: 'contact@neonbite.ma',
  address: 'Boulevard de la Corniche, Casablanca',
  openingHours: 'Ouvert tous les jours 12:00 - 01:00',
  mapUrl: 'https://maps.google.com/?q=Boulevard+de+la+Corniche+Casablanca',
  mapEmbedUrl: 'https://www.google.com/maps?q=Boulevard%20de%20la%20Corniche%20Casablanca&output=embed',
  heroKicker: 'Experience culinaire {{restaurantName}}',
  heroTitle: 'La cuisine devient un spectacle vivant',
  heroText: 'Lumieres immersives, saveurs intenses et assiettes qui arrivent comme une scene de theatre.',
  contactHeadline: 'Creons votre prochaine experience',
  contactDescription: 'Evenements, diners prives, collaborations ou simples questions. Ecrivez-nous, nous repondons rapidement.',
  footerNote: 'Reservez votre table et vivez pleinement l experience NeonBite.'
};
const DEFAULT_SITE_IMAGES = {
  heroBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80',
  reservationPanelBackground: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  contactBackground: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1500&q=80'
};

function toGoogleMapsLink(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
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

const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'Tableau de bord', hint: 'Accueil' },
  { key: 'inventory', label: 'Menu', hint: 'Plats' },
  { key: 'orders', label: 'Reservations', hint: 'Commandes' },
  { key: 'messages', label: 'Messages', hint: 'Boite contact' },
  { key: 'comments', label: 'Commentaires', hint: 'Moderation' },
  { key: 'settings', label: 'Parametres', hint: 'Compte et marque' },
  { key: 'profile', label: 'Profil', hint: 'Identite', showInNav: false }
];

const parseReservationDate = (rawDate) => {
  if (!rawDate) return null;
  const text = String(rawDate).trim();
  if (!text) return null;

  const isoCandidate = text.includes('T') ? text : `${text}T00:00:00`;
  const isoDate = new Date(isoCandidate);
  if (!Number.isNaN(isoDate.getTime())) {
    return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
  }

  const frMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!frMatch) return null;
  const day = Number(frMatch[1]);
  const monthIndex = Number(frMatch[2]) - 1;
  const year = Number(frMatch[3]);
  const candidate = new Date(year, monthIndex, day);
  if (Number.isNaN(candidate.getTime())) return null;
  return candidate;
};

export default function AdminPanel({ apiBase, onDataChanged, adminToken, t, onLogout, adminSection }) {
  const navigate = useNavigate();
  const fallbackCategories = t.adminPanel.fallbackCategories;
  const [plates, setPlates] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [plateForm, setPlateForm] = useState({ ...defaultPlate, category: fallbackCategories[0] || '' });
  const [editingId, setEditingId] = useState(null);
  const [keepImages, setKeepImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [barRangeMode, setBarRangeMode] = useState('6m');
  const [barRangeStart, setBarRangeStart] = useState('');
  const [barRangeEnd, setBarRangeEnd] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsDisplayName, setSettingsDisplayName] = useState('Admin');
  const [settingsLogoPath, setSettingsLogoPath] = useState('');
  const [settingsLogoSize, setSettingsLogoSize] = useState(32);
  const [settingsBrandName, setSettingsBrandName] = useState(DEFAULT_RESTAURANT_INFO.restaurantName);
  const [settingsBrandNameVisible, setSettingsBrandNameVisible] = useState(true);
  const [settingsRestaurantInfo, setSettingsRestaurantInfo] = useState(DEFAULT_RESTAURANT_INFO);
  const [settingsSiteImages, setSettingsSiteImages] = useState(DEFAULT_SITE_IMAGES);
  const [settingsProfilePhotoPath, setSettingsProfilePhotoPath] = useState('');
  const [settingsGalleryImages, setSettingsGalleryImages] = useState([]);
  const [settingsGalleryFiles, setSettingsGalleryFiles] = useState([]);
  const [settingsGalleryInputKey, setSettingsGalleryInputKey] = useState(0);
  const [settingsClassicServices, setSettingsClassicServices] = useState(DEFAULT_CLASSIC_SERVICES);
  const [settingsSpecialOffers, setSettingsSpecialOffers] = useState(DEFAULT_SPECIAL_OFFERS);
  const [settingsLogoFile, setSettingsLogoFile] = useState(null);
  const [settingsLogoInputKey, setSettingsLogoInputKey] = useState(0);
  const [settingsProfilePhotoFile, setSettingsProfilePhotoFile] = useState(null);
  const [settingsProfilePhotoInputKey, setSettingsProfilePhotoInputKey] = useState(0);
  const [serviceImageUploadingKey, setServiceImageUploadingKey] = useState('');
  const [siteImageUploadingKey, setSiteImageUploadingKey] = useState('');

  const validSectionKeys = useMemo(() => ADMIN_SECTIONS.map((item) => item.key), []);
  const activeSection = validSectionKeys.includes(adminSection) ? adminSection : 'dashboard';
  const tp = t.adminPanel || {};
  const ts = t.adminSettings || {};
  const resolvedBrandName = useMemo(() => {
    const raw = String(settingsBrandName || settingsRestaurantInfo?.restaurantName || '').trim();
    return raw || DEFAULT_RESTAURANT_INFO.restaurantName;
  }, [settingsBrandName, settingsRestaurantInfo?.restaurantName]);
  const pendingOrders = reservations.filter((reservation) => reservation.status === 'pending').length;
  const newContactMessages = contactMessages.filter((item) => !item.seenAdmin).length;
  const pendingComments = comments.filter((comment) => comment.status === 'pending').length;
  const sectionTotals = useMemo(() => ({
    inventory: plates.length,
    orders: pendingOrders,
    messages: newContactMessages,
    comments: pendingComments,
    settings: 0,
    profile: 0
  }), [plates.length, pendingOrders, newContactMessages, pendingComments]);

  const reservationStats = useMemo(() => {
    const monthKey = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = (value) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;

    const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    const dayLabel = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });

    const monthBuckets = [];
    const monthMap = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const cursor = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(cursor);
      const bucket = {
        key,
        label: monthLabel.format(cursor).replace('.', '').slice(0, 3),
        count: 0
      };
      monthBuckets.push(bucket);
      monthMap.set(key, bucket);
    }

    const byDay = new Map();
    const statusCounts = { pending: 0, confirmed: 0, cancelled: 0 };
    let guestsTotal = 0;
    let validDateReservations = 0;

    reservations.forEach((reservation) => {
      const statusKey = String(reservation.status || 'pending').toLowerCase();
      if (statusCounts[statusKey] !== undefined) {
        statusCounts[statusKey] += 1;
      } else {
        statusCounts.pending += 1;
      }

      guestsTotal += Number(reservation.guests || 0);

      const parsed = parseReservationDate(reservation.date);
      if (!parsed) return;

      validDateReservations += 1;
      const monthly = monthMap.get(monthKey(parsed));
      if (monthly) monthly.count += 1;

      const dateKey = dayKey(parsed);
      byDay.set(dateKey, (byDay.get(dateKey) || 0) + 1);
    });

    const totalReservations = reservations.length;
    const avgGuests = totalReservations > 0 ? (guestsTotal / totalReservations).toFixed(1) : '0.0';

    const dailyTrend = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([key, count]) => {
        const parsed = new Date(`${key}T00:00:00`);
        return {
          key,
          label: dayLabel.format(parsed),
          count
        };
      });

    const busiestDay = dailyTrend.length
      ? [...dailyTrend].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))[0]
      : null;

    const monthMax = Math.max(1, ...monthBuckets.map((item) => item.count));
    const lastMonthCount = monthBuckets[monthBuckets.length - 1]?.count || 0;
    const previousMonthCount = monthBuckets[monthBuckets.length - 2]?.count || 0;
    const growth = previousMonthCount > 0
      ? Math.round(((lastMonthCount - previousMonthCount) / previousMonthCount) * 100)
      : (lastMonthCount > 0 ? 100 : 0);

    return {
      totalReservations,
      avgGuests,
      validDateReservations,
      growth,
      monthBuckets: monthBuckets.map((item) => ({
        ...item,
        height: Math.max(10, Math.round((item.count / monthMax) * 100))
      })),
      dailyTrend,
      busiestDay,
      statusCounts
    };
  }, [reservations]);

  const barChartStats = useMemo(() => {
    const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    const monthKey = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    const parsePickerDate = (value) => {
      if (!value) return null;
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    };

    let startMonth = null;
    let endMonth = null;
    let customMissingDates = false;
    let customInvalidRange = false;

    if (barRangeMode === 'custom') {
      if (!barRangeStart || !barRangeEnd) {
        customMissingDates = true;
      } else {
        startMonth = parsePickerDate(barRangeStart);
        endMonth = parsePickerDate(barRangeEnd);
        if (!startMonth || !endMonth || startMonth.getTime() > endMonth.getTime()) {
          customInvalidRange = true;
        }
      }
    } else {
      const monthsCount = barRangeMode === '1m' ? 1 : barRangeMode === '3m' ? 3 : 6;
      const now = new Date();
      endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startMonth = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
    }

    if (customMissingDates || customInvalidRange || !startMonth || !endMonth) {
      return {
        buckets: [],
        validDateReservations: 0,
        customMissingDates,
        customInvalidRange
      };
    }

    const monthBuckets = [];
    const monthMap = new Map();
    const cursor = new Date(startMonth);
    while (cursor.getTime() <= endMonth.getTime()) {
      const key = monthKey(cursor);
      const bucket = {
        key,
        label: monthLabel.format(cursor).replace('.', '').slice(0, 3),
        count: 0
      };
      monthBuckets.push(bucket);
      monthMap.set(key, bucket);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    let validDateReservations = 0;
    reservations.forEach((reservation) => {
      const parsed = parseReservationDate(reservation.date);
      if (!parsed) return;
      const parsedMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      if (parsedMonth.getTime() < startMonth.getTime() || parsedMonth.getTime() > endMonth.getTime()) return;
      validDateReservations += 1;
      const bucket = monthMap.get(monthKey(parsed));
      if (bucket) bucket.count += 1;
    });

    const monthMax = Math.max(1, ...monthBuckets.map((item) => item.count));
    return {
      buckets: monthBuckets.map((item) => ({
        ...item,
        height: item.count > 0 ? Math.max(10, Math.round((item.count / monthMax) * 100)) : 0
      })),
      validDateReservations,
      customMissingDates: false,
      customInvalidRange: false
    };
  }, [barRangeMode, barRangeStart, barRangeEnd, reservations]);
  const apiHost = useMemo(() => apiBase.replace('/api', ''), [apiBase]);
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${adminToken}`
    }),
    [adminToken]
  );

  const filteredPlates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return plates;
    return plates.filter((plate) => {
      return (
        String(plate.name || '').toLowerCase().includes(query) ||
        String(plate.category || '').toLowerCase().includes(query)
      );
    });
  }, [plates, searchTerm]);

  const filteredReservations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reservations;
    return reservations.filter((reservation) => {
      return (
        String(reservation.name || '').toLowerCase().includes(query) ||
        String(reservation.phone || '').toLowerCase().includes(query) ||
        String(reservation.date || '').toLowerCase().includes(query)
      );
    });
  }, [reservations, searchTerm]);

  const filteredComments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return comments;
    return comments.filter((comment) => {
      return (
        String(comment.name || '').toLowerCase().includes(query) ||
        String(comment.text || '').toLowerCase().includes(query) ||
        String(comment.status || '').toLowerCase().includes(query)
      );
    });
  }, [comments, searchTerm]);

  const filteredContactMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return contactMessages;
    return contactMessages.filter((item) => (
      String(item.name || '').toLowerCase().includes(query)
      || String(item.email || '').toLowerCase().includes(query)
      || String(item.phone || '').toLowerCase().includes(query)
      || String(item.message || '').toLowerCase().includes(query)
    ));
  }, [contactMessages, searchTerm]);

  const resolveImage = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('/uploads/')) return `${apiHost}${imagePath}`;
    return imagePath;
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
          image: String(item?.image || '').trim()
        };
        if (withBadge) next.badge = String(item?.badge || '').trim();
        return next;
      })
      .filter((item) => item.kicker && item.title && item.text && item.image);
    return normalized.length ? normalized : fallback;
  };
  const normalizeRestaurantInfo = (info) => {
    const merged = { ...DEFAULT_RESTAURANT_INFO, ...(info && typeof info === 'object' ? info : {}) };
    const mapUrl = toGoogleMapsLink(merged.mapUrl).slice(0, 500);
    return {
      restaurantName: String(merged.restaurantName || '').trim().slice(0, 80),
      phone: String(merged.phone || '').trim().slice(0, 40),
      whatsappPhone: String(merged.whatsappPhone || '').replace(/[^\d]/g, '').slice(0, 20),
      email: String(merged.email || '').trim().slice(0, 140),
      address: String(merged.address || '').trim().slice(0, 180),
      openingHours: String(merged.openingHours || '').trim().slice(0, 120),
      mapUrl,
      mapEmbedUrl: toGoogleMapsEmbedUrl(mapUrl, DEFAULT_RESTAURANT_INFO.mapEmbedUrl).slice(0, 700),
      heroKicker: String(merged.heroKicker || '').trim().slice(0, 120),
      heroTitle: String(merged.heroTitle || '').trim().slice(0, 180),
      heroText: String(merged.heroText || '').trim().slice(0, 420),
      contactHeadline: String(merged.contactHeadline || '').trim().slice(0, 120),
      contactDescription: String(merged.contactDescription || '').trim().slice(0, 420),
      footerNote: String(merged.footerNote || '').trim().slice(0, 220)
    };
  };
  const normalizeSiteImages = (images) => {
    const merged = { ...DEFAULT_SITE_IMAGES, ...(images && typeof images === 'object' ? images : {}) };
    return {
      heroBackground: String(merged.heroBackground || '').trim().slice(0, 700),
      reservationPanelBackground: String(merged.reservationPanelBackground || '').trim().slice(0, 700),
      contactBackground: String(merged.contactBackground || '').trim().slice(0, 700)
    };
  };

  const navigateToSection = (nextSection) => {
    navigate(`/admin/${nextSection}`);
  };

  const loadAdminData = async () => {
    const fetchJson = async (url) => {
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) {
        throw new Error(`Request failed: ${url}`);
      }
      return response.json();
    };

    const menuTask = fetchJson(`${apiBase}/menu`).then((menuData) => {
      setPlates(Array.isArray(menuData) ? menuData : []);
    });

    const reservationsTask = fetchJson(`${apiBase}/reservations`).then((reservationsData) => {
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
    });

    const categoriesTask = fetchJson(`${apiBase}/menu/categories`).then((categoriesData) => {
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        setCategories(fallbackCategories);
      }
    });

    const commentsTask = fetchJson(`${apiBase}/admin/comments`).then((commentsData) => {
      setComments(Array.isArray(commentsData) ? commentsData : []);
    });

    const contactMessagesTask = fetchJson(`${apiBase}/admin/contact-messages`).then((contactMessagesData) => {
      setContactMessages(Array.isArray(contactMessagesData) ? contactMessagesData : []);
    });

    const settingsTask = fetchJson(`${apiBase}/admin/settings`).then((settingsData) => {
      setSettingsEmail(String(settingsData?.email || ''));
      setSettingsDisplayName(String(settingsData?.displayName || 'Admin'));
      setSettingsLogoPath(String(settingsData?.logoPath || ''));
      setSettingsLogoSize(Math.max(20, Math.min(80, Number(settingsData?.logoSize || 32))));
      setSettingsBrandName(String(settingsData?.brandName ?? DEFAULT_RESTAURANT_INFO.restaurantName));
      setSettingsBrandNameVisible(Boolean(settingsData?.brandNameVisible ?? true));
      setSettingsRestaurantInfo(normalizeRestaurantInfo(settingsData?.restaurantInfo));
      setSettingsSiteImages(normalizeSiteImages(settingsData?.siteImages));
      setSettingsProfilePhotoPath(String(settingsData?.profilePhotoPath || ''));
      setSettingsGalleryImages(Array.isArray(settingsData?.galleryImages) ? settingsData.galleryImages : []);
      setSettingsClassicServices(normalizeServiceCards(settingsData?.classicServices, DEFAULT_CLASSIC_SERVICES));
      setSettingsSpecialOffers(normalizeServiceCards(settingsData?.specialOffers, DEFAULT_SPECIAL_OFFERS, true));
    });

    await Promise.all([
      menuTask,
      reservationsTask,
      categoriesTask,
      commentsTask,
      contactMessagesTask,
      settingsTask
    ]);
  };

  const syncAfterDataChange = async () => {
    await loadAdminData();
    try {
      await onDataChanged();
    } catch (error) {
      // Keep admin updates even if public refresh fails.
    }
  };

  const updateAdminAccountSettings = async (event) => {
    event.preventDefault();
    const nextEmail = String(settingsEmail || '').trim();
    if (!nextEmail || !settingsCurrentPassword) {
      showMessage('danger', ts.accountRequired || 'Email et mot de passe actuel sont obligatoires.');
      return;
    }
    if (settingsNewPassword && settingsNewPassword !== settingsConfirmPassword) {
      showMessage('danger', ts.newPasswordMismatch || 'Confirmation du nouveau mot de passe invalide.');
      return;
    }

    const response = await fetch(`${apiBase}/admin/settings/account`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        currentPassword: settingsCurrentPassword,
        newEmail: nextEmail,
        newPassword: settingsNewPassword,
        newDisplayName: settingsDisplayName
      })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.accountUpdateFail || 'Mise a jour du compte impossible.');
      return;
    }

    showMessage('success', data.message || ts.accountUpdated || 'Parametres du compte mis a jour.');
    setSettingsCurrentPassword('');
    setSettingsNewPassword('');
    setSettingsConfirmPassword('');
    setTimeout(() => onLogout(), 600);
  };

  const updateSiteLogo = async (event) => {
    event.preventDefault();
    if (!settingsLogoFile) {
      showMessage('danger', ts.selectLogo || 'Selectionne un logo a uploader.');
      return;
    }

    const formData = new FormData();
    formData.append('logo', settingsLogoFile);
    const response = await fetch(`${apiBase}/admin/settings/logo`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.logoUpdateFail || 'Mise a jour du logo impossible.');
      return;
    }

    setSettingsLogoPath(String(data.logoPath || ''));
    setSettingsLogoFile(null);
    setSettingsLogoInputKey((prev) => prev + 1);
    showMessage('success', ts.logoUpdated || 'Logo mis a jour.');
    await syncAfterDataChange();
  };

  const removeSiteLogo = async () => {
    if (!window.confirm(ts.deleteLogoConfirm || 'Supprimer le logo du site ?')) return;
    const response = await fetch(`${apiBase}/admin/settings/logo`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.logoDeleteFail || 'Suppression logo impossible.');
      return;
    }
    setSettingsLogoPath('');
    showMessage('success', data.message || ts.logoDeleted || 'Logo supprime.');
    await syncAfterDataChange();
  };

  const updateSiteLogoSize = async (event) => {
    event.preventDefault();
    const response = await fetch(`${apiBase}/admin/settings/logo-size`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ size: settingsLogoSize })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.logoSizeUpdateFail || 'Mise a jour taille logo impossible.');
      return;
    }
    setSettingsLogoSize(Math.max(20, Math.min(80, Number(data.logoSize || settingsLogoSize))));
    showMessage('success', data.message || ts.logoSizeUpdated || 'Taille logo mise a jour.');
    await syncAfterDataChange();
  };

  const updateSiteBrandLabel = async (event) => {
    event.preventDefault();
    const response = await fetch(`${apiBase}/admin/settings/brand-name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        brandName: String(settingsBrandName || '').trim(),
        brandNameVisible: settingsBrandNameVisible
      })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.brandNameUpdateFail || 'Mise a jour du nom de marque impossible.');
      return;
    }
    setSettingsBrandName(String(data.brandName || ''));
    setSettingsBrandNameVisible(Boolean(data.brandNameVisible));
    showMessage('success', data.message || ts.brandNameUpdated || 'Nom de marque mis a jour.');
    await syncAfterDataChange();
  };

  const onRestaurantInfoFieldChange = (field, value) => {
    setSettingsRestaurantInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateRestaurantInfoSettings = async (event) => {
    event.preventDefault();
    const rawMapUrl = String(settingsRestaurantInfo?.mapUrl || '').trim();
    if (/maps\.app\.goo\.gl/i.test(rawMapUrl)) {
      showMessage('warning', ts.shortMapsNotSupported || 'Le lien maps.app.goo.gl ne peut pas etre integre directement. Ouvrez-le dans le navigateur puis copiez l URL finale maps.google.com.');
      return;
    }
    const restaurantInfo = normalizeRestaurantInfo(settingsRestaurantInfo);
    if (!restaurantInfo.restaurantName) {
      showMessage('danger', ts.restaurantNameRequired || 'Le nom du restaurant est obligatoire.');
      return;
    }
    const response = await fetch(`${apiBase}/admin/settings/restaurant-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ restaurantInfo })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.restaurantInfoUpdateFail || 'Mise a jour infos restaurant impossible.');
      return;
    }
    setSettingsRestaurantInfo(normalizeRestaurantInfo(data.restaurantInfo));
    showMessage('success', data.message || ts.restaurantInfoUpdated || 'Infos restaurant mises a jour.');
    await syncAfterDataChange();
  };

  const updateSiteImageField = (field, value) => {
    setSettingsSiteImages((prev) => ({ ...prev, [field]: value }));
  };

  const uploadSiteImage = async (field, file) => {
    if (!file) {
      showMessage('danger', ts.selectLocalImage || 'Selectionne une image locale.');
      return;
    }
    setSiteImageUploadingKey(field);
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${apiBase}/admin/settings/site-image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await response.json();
    setSiteImageUploadingKey('');
    if (!response.ok) {
      showMessage('danger', data.message || ts.siteImageUploadFail || 'Televersement de l image du site impossible.');
      return;
    }
    const nextSiteImages = normalizeSiteImages({
      ...settingsSiteImages,
      [field]: String(data.imagePath || '')
    });

    const saveResponse = await fetch(`${apiBase}/admin/settings/site-images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ siteImages: nextSiteImages })
    });
    const saveData = await saveResponse.json();
    if (!saveResponse.ok) {
      showMessage('danger', saveData.message || ts.siteImagesUpdateFail || 'Mise a jour images site impossible.');
      return;
    }

    setSettingsSiteImages(normalizeSiteImages(saveData.siteImages));
    showMessage('success', ts.siteImageUpdated || 'Image site mise a jour.');
    await syncAfterDataChange();
  };

  const updateSiteImagesSettings = async (event) => {
    event.preventDefault();
    const siteImages = normalizeSiteImages(settingsSiteImages);
    const response = await fetch(`${apiBase}/admin/settings/site-images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ siteImages })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.siteImagesUpdateFail || 'Mise a jour images site impossible.');
      return;
    }
    setSettingsSiteImages(normalizeSiteImages(data.siteImages));
    showMessage('success', data.message || ts.siteImagesUpdated || 'Images site mises a jour.');
    await syncAfterDataChange();
  };

  const updateAdminProfilePhoto = async (event) => {
    event.preventDefault();
    if (!settingsProfilePhotoFile) {
      showMessage('danger', ts.selectProfilePhoto || 'Selectionne une photo de profil.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', settingsProfilePhotoFile);
    const response = await fetch(`${apiBase}/admin/settings/profile-photo`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.profilePhotoUpdateFail || 'Mise a jour photo profil impossible.');
      return;
    }

    setSettingsProfilePhotoPath(String(data.profilePhotoPath || ''));
    setSettingsProfilePhotoFile(null);
    setSettingsProfilePhotoInputKey((prev) => prev + 1);
    showMessage('success', data.message || ts.profilePhotoUpdated || 'Photo profil mise a jour.');
    await syncAfterDataChange();
  };

  const updateAdminDisplayName = async (event) => {
    event.preventDefault();
    const displayName = String(settingsDisplayName || '').trim();
    if (!displayName) {
      showMessage('danger', ts.adminNameRequired || 'Le nom admin est obligatoire.');
      return;
    }

    const response = await fetch(`${apiBase}/admin/settings/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ displayName })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.profileUpdateFail || 'Mise a jour du profil impossible.');
      return;
    }
    setSettingsDisplayName(String(data.displayName || displayName));
    showMessage('success', data.message || ts.adminNameUpdated || 'Nom admin mis a jour.');
  };

  const uploadGalleryImages = async (event) => {
    event.preventDefault();
    if (!settingsGalleryFiles.length) {
      showMessage('danger', ts.galleryImageRequired || 'Selectionne au moins une image pour la galerie.');
      return;
    }

    const formData = new FormData();
    settingsGalleryFiles.forEach((file) => formData.append('images', file));
    const response = await fetch(`${apiBase}/admin/gallery/images`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.galleryUploadFail || 'Televersement de la galerie impossible.');
      return;
    }

    setSettingsGalleryImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
    setSettingsGalleryFiles([]);
    setSettingsGalleryInputKey((prev) => prev + 1);
    showMessage('success', data.message || ts.galleryAdded || 'Images galerie ajoutees.');
    await syncAfterDataChange();
  };

  const deleteGalleryImage = async (id) => {
    if (!window.confirm(ts.deleteGalleryImageConfirm || 'Supprimer cette image de la galerie ?')) return;
    const response = await fetch(`${apiBase}/admin/gallery/images/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.imageDeleteFail || 'Suppression image impossible.');
      return;
    }

    setSettingsGalleryImages((prev) => prev.filter((item) => item.id !== id));
    showMessage('success', data.message || ts.imageDeleted || 'Image supprimee.');
    await syncAfterDataChange();
  };

  const updateServiceCardField = (type, index, field, value) => {
    const setter = type === 'classic' ? setSettingsClassicServices : setSettingsSpecialOffers;
    setter((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const uploadServiceCardImage = async (type, index, file) => {
    if (!file) {
      showMessage('danger', ts.selectCardImage || 'Selectionne une image locale pour la carte.');
      return;
    }
    const key = `${type}-${index}`;
    setServiceImageUploadingKey(key);
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${apiBase}/admin/settings/service-image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const data = await response.json();
    setServiceImageUploadingKey('');
    if (!response.ok) {
      showMessage('danger', data.message || ts.serviceImageUploadFail || 'Televersement de l image de service impossible.');
      return;
    }
    const nextImagePath = String(data.imagePath || '');
    const nextClassicServices = type === 'classic'
      ? settingsClassicServices.map((item, itemIndex) => (itemIndex === index ? { ...item, image: nextImagePath } : item))
      : settingsClassicServices;
    const nextSpecialOffers = type === 'special'
      ? settingsSpecialOffers.map((item, itemIndex) => (itemIndex === index ? { ...item, image: nextImagePath } : item))
      : settingsSpecialOffers;

    setSettingsClassicServices(nextClassicServices);
    setSettingsSpecialOffers(nextSpecialOffers);

    const classic = normalizeServiceCards(nextClassicServices, [], false);
    const offers = normalizeServiceCards(nextSpecialOffers, [], true);
    if (!classic.length || !offers.length) {
      showMessage('danger', ts.serviceSaveInvalid || 'Sauvegarde services impossible: verifie les champs des cartes.');
      return;
    }

    const saveResponse = await fetch(`${apiBase}/admin/settings/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        classicServices: classic,
        specialOffers: offers
      })
    });
    const saveData = await saveResponse.json();
    if (!saveResponse.ok) {
      showMessage('danger', saveData.message || ts.serviceSaveAfterUploadFail || 'Image uploadee mais sauvegarde services impossible.');
      return;
    }

    setSettingsClassicServices(normalizeServiceCards(saveData.classicServices, classic));
    setSettingsSpecialOffers(normalizeServiceCards(saveData.specialOffers, offers, true));
    showMessage('success', ts.serviceImageUpdated || 'Image service mise a jour.');
    await syncAfterDataChange();
  };

  const addServiceCard = (type) => {
    const emptyClassic = { kicker: '', title: '', text: '', image: '' };
    const emptyOffer = { kicker: '', title: '', text: '', badge: '', image: '' };
    const setter = type === 'classic' ? setSettingsClassicServices : setSettingsSpecialOffers;
    setter((prev) => (prev.length >= 12 ? prev : [...prev, type === 'classic' ? emptyClassic : emptyOffer]));
  };

  const removeServiceCard = (type, index) => {
    const setter = type === 'classic' ? setSettingsClassicServices : setSettingsSpecialOffers;
    setter((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateServicesContent = async (event) => {
    event.preventDefault();
    const classic = normalizeServiceCards(settingsClassicServices, [], false);
    const offers = normalizeServiceCards(settingsSpecialOffers, [], true);
    if (!classic.length || !offers.length) {
      showMessage('danger', ts.servicesMinCards || 'Ajoute au moins une carte valide pour chaque section services.');
      return;
    }

    const response = await fetch(`${apiBase}/admin/settings/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        classicServices: classic,
        specialOffers: offers
      })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || ts.servicesUpdateFail || 'Mise a jour des services impossible.');
      return;
    }

    setSettingsClassicServices(normalizeServiceCards(data.classicServices, classic));
    setSettingsSpecialOffers(normalizeServiceCards(data.specialOffers, offers, true));
    showMessage('success', data.message || ts.servicesUpdated || 'Cartes services mises a jour.');
    await syncAfterDataChange();
  };

  useEffect(() => {
    loadAdminData().catch(() => {
      setMessage({ type: 'danger', text: t.adminPanel.loadFail });
    });
  }, [adminToken, t]);

  useEffect(() => {
    if (!categories.length) return;
    setPlateForm((prev) => (
      categories.includes(prev.category)
        ? prev
        : { ...prev, category: categories[0] || fallbackCategories[0] || '' }
    ));
  }, [categories, fallbackCategories]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const showMessage = (type, text) => setMessage({ type, text });

  const onChangePlate = (event) => {
    const { name, value } = event.target;
    setPlateForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetPlateForm = () => {
    setPlateForm({ ...defaultPlate, category: categories[0] || fallbackCategories[0] || '' });
    setEditingId(null);
    setKeepImages([]);
    setNewImages([]);
    setFileInputKey((prev) => prev + 1);
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    const remaining = 4 - keepImages.length;

    if (remaining <= 0) {
      showMessage('danger', t.adminPanel.maxPhotos);
      setNewImages([]);
      setFileInputKey((prev) => prev + 1);
      return;
    }

    if (files.length > remaining) {
      showMessage('danger', replaceParam(t.adminPanel.addPhotosLeft, 'count', remaining));
    }

    setNewImages(files.slice(0, remaining));
  };

  const removeKeptImage = (imagePath) => {
    setKeepImages((prev) => prev.filter((img) => img !== imagePath));
  };

  const submitPlate = async (event) => {
    event.preventDefault();

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiBase}/menu/${editingId}` : `${apiBase}/menu`;

    const formData = new FormData();
    formData.append('name', plateForm.name);
    formData.append('description', plateForm.description);
    formData.append('category', plateForm.category);
    formData.append('price', String(plateForm.price));
    formData.append('keepImages', JSON.stringify(keepImages));
    newImages.forEach((file) => formData.append('images', file));

    const response = await fetch(url, {
      method,
      headers: authHeaders,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || t.adminPanel.plateActionFail);
      return;
    }

    showMessage('success', editingId ? t.adminPanel.plateUpdated : t.adminPanel.plateAdded);
    resetPlateForm();
    await syncAfterDataChange();
  };

  const editPlate = (plate) => {
    setEditingId(plate.id);
    setPlateForm({
      name: plate.name,
      description: plate.description,
      category: plate.category,
      price: plate.price
    });
    setKeepImages(Array.isArray(plate.images) ? plate.images : plate.image ? [plate.image] : []);
    setNewImages([]);
    setFileInputKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePlate = async (id) => {
    if (!window.confirm(t.adminPanel.deletePlateConfirm)) return;

    const response = await fetch(`${apiBase}/menu/${id}`, { method: 'DELETE', headers: authHeaders });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || t.adminPanel.deleteFail);
      return;
    }

    showMessage('success', t.adminPanel.plateDeleted);
    await syncAfterDataChange();
  };

  const createCategory = async (event) => {
    event.preventDefault();
    const name = String(newCategoryName || '').trim();
    if (!name) {
      showMessage('danger', tp.categoryNameRequired || 'Le nom de la categorie est obligatoire.');
      return;
    }

    const response = await fetch(`${apiBase}/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || tp.categoryCreateFail || 'Creation de categorie impossible.');
      return;
    }

    setNewCategoryName('');
    showMessage('success', data.message || tp.categoryAdded || 'Categorie ajoutee.');
    await loadAdminData();
  };

  const deleteCategory = async (name) => {
    if (!window.confirm(replaceParam(tp.deleteCategoryConfirm || 'Supprimer la categorie "{{name}}" ?', 'name', name))) return;
    const response = await fetch(`${apiBase}/menu/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || tp.categoryDeleteFail || 'Suppression de categorie impossible.');
      return;
    }

    if (plateForm.category === name) {
      setPlateForm((prev) => ({ ...prev, category: '' }));
    }
    showMessage('success', data.message || tp.categoryDeleted || 'Categorie supprimee.');
    await loadAdminData();
  };

  const updateReservationStatus = async (id, status) => {
    const response = await fetch(`${apiBase}/reservations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || t.adminPanel.reservationStatusFail);
      return;
    }

    showMessage('success', t.adminPanel.reservationUpdated);
    await loadAdminData();
  };

  const deleteReservation = async (id) => {
    if (!window.confirm(t.adminPanel.deleteReservationConfirm)) return;

    const response = await fetch(`${apiBase}/reservations/${id}`, { method: 'DELETE', headers: authHeaders });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || t.adminPanel.deleteFail);
      return;
    }

    showMessage('success', t.adminPanel.reservationDeleted);
    await loadAdminData();
  };

  const updateCommentStatus = async (id, status, currentStatus) => {
    if (status === currentStatus) return;
    if (currentStatus === 'approved' && status !== 'approved') {
      showMessage('warning', tp.approvedCommentLocked || 'Le commentaire approuve est verrouille et ne peut pas etre modifie.');
      return;
    }

    const response = await fetch(`${apiBase}/admin/comments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || tp.commentUpdateFail || 'Mise a jour du commentaire impossible.');
      return;
    }

    showMessage('success', tp.commentUpdated || 'Commentaire mis a jour.');
    await loadAdminData();
  };

  const deleteComment = async (id) => {
    if (!window.confirm(tp.deleteCommentConfirm || 'Supprimer ce commentaire ?')) return;

    const response = await fetch(`${apiBase}/admin/comments/${id}`, { method: 'DELETE', headers: authHeaders });
    const data = await response.json();
    if (!response.ok) {
      showMessage('danger', data.message || tp.commentDeleteFail || 'Suppression du commentaire impossible.');
      return;
    }

    showMessage('success', tp.commentDeleted || 'Commentaire supprime.');
    await loadAdminData();
  };

  const markContactMessageSeen = async (id) => {
    const response = await fetch(`${apiBase}/admin/contact-messages/${id}/seen`, {
      method: 'PUT',
      headers: authHeaders
    });

    if (!response.ok) {
      showMessage('danger', tp.markMessageSeenFail || 'Marquage du message comme lu impossible.');
      return;
    }

    await loadAdminData();
  };

  const deleteContactMessage = async (id) => {
    if (!window.confirm(tp.deleteContactMessageConfirm || 'Supprimer ce message de contact ?')) return;

    const response = await fetch(`${apiBase}/admin/contact-messages/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage('danger', data.message || tp.contactMessageDeleteFail || 'Suppression du message de contact impossible.');
      return;
    }

    showMessage('success', tp.contactMessageDeleted || 'Message de contact supprime.');
    await loadAdminData();
  };

  const renderDashboardPage = () => {
    const totalReservations = reservationStats.totalReservations;
    const statusOrder = [
      { key: 'pending', label: tp.pendingLabel || tp.pending || 'En attente', color: '#fcb045' },
      { key: 'confirmed', label: tp.confirmedLabel || tp.confirmed || 'Confirmee', color: '#24b48a' },
      { key: 'cancelled', label: tp.cancelledLabel || tp.cancelled || 'Annulee', color: '#ef5e78' }
    ];
    const statusBreakdown = statusOrder.map((item) => {
      const count = Number(reservationStats.statusCounts[item.key] || 0);
      const ratio = totalReservations > 0 ? count / totalReservations : 1 / statusOrder.length;
      return {
        ...item,
        count,
        ratio,
        percent: totalReservations > 0 ? Math.round((count / totalReservations) * 100) : 0
      };
    });
    let donutCursor = 0;
    const donutSegments = statusBreakdown.map((item) => {
      const start = donutCursor;
      const sweep = item.ratio * 360;
      donutCursor += sweep;
      return `${item.color} ${start}deg ${start + sweep}deg`;
    });
    const statusDonutStyle = { background: `conic-gradient(${donutSegments.join(', ')})` };
    const monthChartWidth = 560;
    const monthChartHeight = 210;
    const monthChartPaddingX = 24;
    const monthChartPaddingY = 22;
    const monthChartMax = Math.max(1, ...barChartStats.buckets.map((item) => item.count));
    const monthLinePoints = barChartStats.buckets
      .map((item, index) => {
        const x = barChartStats.buckets.length <= 1
          ? monthChartWidth / 2
          : monthChartPaddingX + (index * (monthChartWidth - monthChartPaddingX * 2)) / (barChartStats.buckets.length - 1);
        const y = monthChartHeight - monthChartPaddingY - ((item.count / monthChartMax) * (monthChartHeight - monthChartPaddingY * 2));
        return `${x},${y}`;
      })
      .join(' ');
    const monthAreaPoints = `${monthChartPaddingX},${monthChartHeight - monthChartPaddingY} ${monthLinePoints} ${monthChartWidth - monthChartPaddingX},${monthChartHeight - monthChartPaddingY}`;

    return (
      <div className="admin-resv-dashboard">
        <div className="admin-resv-kpi-grid">
          <article className="admin-resv-kpi-card">
            <p>{tp.kpiTotalReservations || 'Total reservations'}</p>
            <h4>{reservations.length}</h4>
            <small>{tp.kpiAllReservations || 'Toutes les reservations'}</small>
          </article>
          <article className="admin-resv-kpi-card">
            <p>{tp.kpiTotalComments || 'Total commentaires'}</p>
            <h4>{comments.length}</h4>
            <small>{tp.kpiAllComments || 'Tous les commentaires'}</small>
          </article>
          <article className="admin-resv-kpi-card">
            <p>{tp.kpiTotalMessages || 'Total messages'}</p>
            <h4>{contactMessages.length}</h4>
            <small>{tp.kpiAllContactMessages || 'Tous les messages contact'}</small>
          </article>
          <article className="admin-resv-kpi-card">
            <p>{tp.kpiTotalMenu || 'Total menu'}</p>
            <h4>{plates.length}</h4>
            <small>{tp.kpiAllMenuItems || 'Tous les plats menu'}</small>
          </article>
        </div>

        <div className="admin-resv-chart-grid mt-4">
          <div className="reservation-box admin-resv-chart-card">
            <div className="admin-resv-chart-head">
              <h5 className="m-0">{tp.reservationStatsTitle || 'Statistique de reservation'}</h5>
              <span>{replaceParam(tp.validDatesCount || '{{count}} dates valides', 'count', barChartStats.validDateReservations)}</span>
            </div>
            <div className="admin-resv-filter-bar">
              <select
                className="form-select form-select-sm admin-resv-filter-select"
                value={barRangeMode}
                onChange={(event) => setBarRangeMode(event.target.value)}
              >
                <option value="1m">{tp.rangeLastMonth || 'Dernier mois'}</option>
                <option value="3m">{tp.rangeLast3Months || '3 derniers mois'}</option>
                <option value="6m">{tp.rangeLast6Months || '6 derniers mois'}</option>
                <option value="custom">{tp.rangeCustom || 'Periode perso'}</option>
              </select>
              {barRangeMode === 'custom' && (
                <div className="admin-resv-filter-dates">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={barRangeStart}
                    onChange={(event) => setBarRangeStart(event.target.value)}
                    aria-label={tp.startDate || 'Date debut'}
                  />
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={barRangeEnd}
                    onChange={(event) => setBarRangeEnd(event.target.value)}
                    aria-label={tp.endDate || 'Date fin'}
                  />
                </div>
              )}
            </div>
            {barChartStats.customMissingDates ? (
              <div className="admin-resv-empty">{tp.selectDateRange || 'Selectionne une date debut et une date fin pour afficher le chart.'}</div>
            ) : barChartStats.customInvalidRange ? (
              <div className="admin-resv-empty">{tp.invalidDateRange || 'La date debut doit etre inferieure ou egale a la date fin.'}</div>
            ) : (
              <div className="admin-resv-month-chart-wrap">
                <svg viewBox={`0 0 ${monthChartWidth} ${monthChartHeight}`} preserveAspectRatio="none" className="admin-resv-month-svg">
                  <defs>
                    <linearGradient id="adminMonthArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(33, 185, 241, 0.35)" />
                      <stop offset="100%" stopColor="rgba(40, 212, 164, 0.05)" />
                    </linearGradient>
                    <linearGradient id="adminMonthStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1fb6ff" />
                      <stop offset="100%" stopColor="#28d4a4" />
                    </linearGradient>
                  </defs>
                  <polygon points={monthAreaPoints} fill="url(#adminMonthArea)" />
                  <polyline points={monthLinePoints} fill="none" stroke="url(#adminMonthStroke)" strokeWidth="4" strokeLinecap="round" />
                  {barChartStats.buckets.map((item, index) => {
                    const x = barChartStats.buckets.length <= 1
                      ? monthChartWidth / 2
                      : monthChartPaddingX + (index * (monthChartWidth - monthChartPaddingX * 2)) / (barChartStats.buckets.length - 1);
                    const y = monthChartHeight - monthChartPaddingY - ((item.count / monthChartMax) * (monthChartHeight - monthChartPaddingY * 2));
                    return <circle key={item.key} cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#1a7fa6" strokeWidth="2" />;
                  })}
                </svg>
                <div className="admin-resv-month-labels">
                  {barChartStats.buckets.map((item) => (
                    <span key={item.key}>
                      <strong>{item.count}</strong>
                      <small>{item.label}</small>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="reservation-box admin-resv-status-card">
            <div className="admin-resv-chart-head">
              <h5 className="m-0">{tp.statusBreakdownTitle || 'Repartition par statut'}</h5>
              <span>{tp.statusBreakdownLegend || 'En attente / Confirmee / Annulee'}</span>
            </div>
            <div className="admin-resv-status-creative">
              <div className="admin-resv-donut-wrap">
                <div className="admin-resv-donut" style={statusDonutStyle}>
                  <div className="admin-resv-donut-core">
                    <strong>{totalReservations}</strong>
                    <small>{tp.reservationsLabel || 'reservations'}</small>
                  </div>
                </div>
              </div>
              <div className="admin-resv-status-grid">
                {statusBreakdown.map((item) => (
                  <article key={item.key} className={`admin-resv-status-item admin-resv-status-item-${item.key}`}>
                    <div className="admin-resv-status-meta">
                      <span className={`admin-resv-status-dot admin-resv-status-dot-${item.key}`} aria-hidden="true" />
                      <strong>{item.label}</strong>
                    </div>
                    <div className="admin-resv-status-values">
                      <span>{item.count}</span>
                      <small>{item.percent}%</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryPage = () => (
    <>
      <div className="reservation-box mb-4">
        <h3 className="mb-3">{tp.menuTypes || 'Types du menu'}</h3>
        <form className="d-flex gap-2 flex-wrap mb-3" onSubmit={createCategory}>
          <input
            className="form-control"
            style={{ maxWidth: '320px' }}
            placeholder={tp.newCategory || 'Nouvelle categorie'}
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            maxLength={60}
          />
          <button className="btn btn-warning" type="submit">{tp.addCategory || 'Ajouter categorie'}</button>
        </form>
        <div className="d-flex gap-2 flex-wrap">
          {categories.map((category) => (
            <span key={category} className="badge text-bg-dark d-inline-flex align-items-center gap-2 px-3 py-2">
              {category}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => deleteCategory(category)}
                title={tp.deleteCategory || 'Supprimer categorie'}
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="reservation-box mb-4 admin-plate-form-card">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h3 className="m-0">{editingId ? t.adminPanel.editPlate : t.adminPanel.addPlate}</h3>
          {editingId && (
            <button className="btn btn-outline-light btn-sm" onClick={resetPlateForm}>
              {t.adminPanel.cancelEdit}
            </button>
          )}
        </div>
        <form onSubmit={submitPlate} className="admin-plate-form">
          <div className="row g-3 admin-plate-grid">
            <div className="col-md-6">
              <input className="form-control" name="name" placeholder={t.adminPanel.plateName} value={plateForm.name} onChange={onChangePlate} required />
            </div>
            <div className="col-md-3">
              <select className="form-select" name="category" value={plateForm.category} onChange={onChangePlate} required>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input className="form-control" name="price" type="number" step="0.01" placeholder={t.adminPanel.price} value={plateForm.price} onChange={onChangePlate} required />
            </div>
            <div className="col-md-9">
              <input
                key={fileInputKey}
                className="form-control"
                name="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
              />
              <small className="text-light-emphasis">{t.adminPanel.uploadInfo}</small>
            </div>
            <div className="col-12">
              <textarea className="form-control" name="description" rows="3" placeholder={t.adminPanel.description} value={plateForm.description} onChange={onChangePlate} required />
            </div>
          </div>

          {(keepImages.length > 0 || newImages.length > 0) && (
            <div className="mt-3">
              <p className="mb-2">{replaceParam(t.adminPanel.platePhotos, 'count', keepImages.length + newImages.length)}</p>
              <div className="admin-image-grid">
                {keepImages.map((imagePath) => (
                  <div className="admin-image-item" key={imagePath}>
                    <img src={resolveImage(imagePath)} alt={t.adminPanel.plate} loading="lazy" decoding="async" />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeKeptImage(imagePath)}>
                      {t.adminPanel.remove}
                    </button>
                  </div>
                ))}
                {newImages.map((file) => (
                  <div className="admin-image-item" key={file.name + file.lastModified}>
                    <div className="new-image-placeholder">{file.name}</div>
                    <span className="badge text-bg-info">{t.adminPanel.new}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-warning mt-3" type="submit">
            {editingId ? t.adminPanel.updatePlate : t.adminPanel.addPlateBtn}
          </button>
        </form>
      </div>

      <div className="reservation-box admin-plate-table-card">
        <h3 className="mb-3">{t.adminPanel.platesManagement}</h3>
        <div className="table-responsive admin-table-wrap">
          <table className="table table-hover align-middle admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t.adminPanel.plate}</th>
                <th>{t.adminPanel.category}</th>
                <th>{t.adminPanel.photos}</th>
                <th>{t.adminPanel.price}</th>
                <th>{t.adminPanel.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlates.map((plate) => (
                <tr key={plate.id}>
                  <td>{plate.id}</td>
                  <td>{plate.name}</td>
                  <td>{plate.category}</td>
                  <td>{Array.isArray(plate.images) ? plate.images.length : 0}</td>
                  <td>{Number(plate.price).toFixed(2)} DH</td>
                  <td>
                    <div className="admin-table-actions">
                      <button className="btn btn-sm btn-outline-warning" onClick={() => editPlate(plate)}>{t.adminPanel.edit}</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deletePlate(plate.id)}>{t.adminPanel.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderOrdersPage = () => (
    <div className="reservation-box">
      <h3 className="mb-3">{t.adminPanel.reservationsManagement}</h3>
      <div className="table-responsive admin-table-wrap">
        <table className="table table-hover align-middle admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t.adminPanel.client}</th>
              <th>{t.adminPanel.telephone}</th>
              <th>{t.adminPanel.guests}</th>
              <th>{tp.date || 'Date'}</th>
              <th>{t.adminPanel.time}</th>
              <th>{t.adminPanel.status}</th>
              <th>{t.adminPanel.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.id}</td>
                <td>{reservation.name}</td>
                <td>{reservation.phone}</td>
                <td>
                  <span className="admin-count-pill">{reservation.guests}</span>
                </td>
                <td>{reservation.date}</td>
                <td>{reservation.time}</td>
                <td>
                  <select
                    className="form-select form-select-sm admin-select-sm"
                    value={reservation.status}
                    onChange={(e) => updateReservationStatus(reservation.id, e.target.value)}
                  >
                    <option value="pending">{t.adminPanel.pending}</option>
                    <option value="confirmed">{t.adminPanel.confirmed}</option>
                    <option value="cancelled">{t.adminPanel.cancelled}</option>
                  </select>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteReservation(reservation.id)}>{t.adminPanel.delete}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCommentsPage = () => (
    <div className="reservation-box">
      <h3 className="mb-3">{tp.commentsModeration || 'Moderation des commentaires'}</h3>
      <div className="table-responsive admin-table-wrap">
        <table className="table table-hover align-middle admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{tp.name || 'Nom'}</th>
              <th>{tp.rating || 'Note'}</th>
              <th>{tp.comment || 'Commentaire'}</th>
              <th>{tp.status || 'Statut'}</th>
              <th>{tp.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.id}</td>
                <td>{comment.name}</td>
                <td>
                  <span className="admin-rating-pill">
                    {'\u2605'.repeat(Math.max(1, Number(comment.rating) || 1))}
                  </span>
                </td>
                <td style={{ minWidth: '260px' }}>
                  <div className="admin-message-cell">{comment.text}</div>
                </td>
                <td>
                  <div className="admin-status-stack">
                    <span className={`admin-status-pill admin-status-${comment.status || 'pending'}`}>
                      {comment.status === 'approved'
                        ? (tp.approved || 'Approuve')
                        : comment.status === 'rejected'
                          ? (tp.rejected || 'Rejete')
                          : (tp.pendingLabel || tp.pending || 'En attente')}
                    </span>
                    <div className="admin-status-controls">
                      <button
                        type="button"
                        className={`btn btn-sm admin-status-btn admin-status-btn-pending ${comment.status === 'pending' ? 'is-active' : ''}`}
                        disabled={comment.status === 'approved'}
                        onClick={() => updateCommentStatus(comment.id, 'pending', comment.status)}
                      >
                        {tp.pendingLabel || 'En attente'}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm admin-status-btn admin-status-btn-approved ${comment.status === 'approved' ? 'is-active' : ''}`}
                        onClick={() => updateCommentStatus(comment.id, 'approved', comment.status)}
                      >
                        {tp.approved || 'Approuve'}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm admin-status-btn admin-status-btn-rejected ${comment.status === 'rejected' ? 'is-active' : ''}`}
                        disabled={comment.status === 'approved'}
                        onClick={() => updateCommentStatus(comment.id, 'rejected', comment.status)}
                      >
                        {tp.rejected || 'Rejete'}
                      </button>
                    </div>
                    {comment.status === 'approved' && <small className="admin-status-lock">{tp.lockedAfterApproval || 'Verrouille apres approbation'}</small>}
                  </div>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteComment(comment.id)}>{tp.delete || 'Supprimer'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMessagesPage = () => (
    <div className="reservation-box">
      <h3 className="mb-3">{tp.contactMessages || 'Messages de contact'}</h3>
      <div className="table-responsive admin-table-wrap">
        <table className="table table-hover align-middle admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{tp.name || 'Nom'}</th>
              <th>{tp.email || 'Email'}</th>
              <th>{tp.telephone || 'Telephone'}</th>
              <th>{tp.message || 'Message'}</th>
              <th>{tp.status || 'Status'}</th>
              <th>{tp.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredContactMessages.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone || '-'}</td>
                <td style={{ minWidth: '260px' }}>
                  <div className="admin-message-cell">{item.message}</div>
                </td>
                <td>
                  <span className={`badge ${item.seenAdmin ? 'text-bg-success' : 'text-bg-warning'}`}>
                    {item.seenAdmin ? (tp.seen || 'Lu') : (tp.new || 'Nouveau')}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    {!item.seenAdmin && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => markContactMessageSeen(item.id)}>
                        {tp.markAsSeen || 'Marquer comme lu'}
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteContactMessage(item.id)}>
                      {tp.delete || 'Supprimer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettingsPage = () => (
    <div className="admin-settings-grid">
      <article className="reservation-box">
        <h3 className="mb-3">{ts.accountTitle || 'Compte Admin'}</h3>
        <form onSubmit={updateAdminAccountSettings}>
          <div className="mb-3">
            <label className="form-label small mb-1">{ts.adminEmail || 'Email admin'}</label>
            <input
              type="email"
              className="form-control"
              value={settingsEmail}
              onChange={(event) => setSettingsEmail(event.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small mb-1">{ts.currentPassword || 'Mot de passe actuel'}</label>
            <input
              type="password"
              className="form-control"
              value={settingsCurrentPassword}
              onChange={(event) => setSettingsCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small mb-1">{ts.newPassword || 'Nouveau mot de passe'}</label>
            <input
              type="password"
              className="form-control"
              value={settingsNewPassword}
              onChange={(event) => setSettingsNewPassword(event.target.value)}
              placeholder={ts.optionalPlaceholder || 'Facultatif'}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small mb-1">{ts.confirmNewPassword || 'Confirmation nouveau mot de passe'}</label>
            <input
              type="password"
              className="form-control"
              value={settingsConfirmPassword}
              onChange={(event) => setSettingsConfirmPassword(event.target.value)}
            />
          </div>
          <button className="btn btn-warning" type="submit">{ts.saveAccount || 'Sauvegarder compte'}</button>
        </form>
      </article>

      <article className="reservation-box admin-settings-span-full">
        <h3 className="mb-2">Branding & Infos Restaurant</h3>
        <p className="mb-0 text-light-emphasis">
          Le logo et les informations du restaurant sont fixes dans le code (mode verrouille) et ne sont plus modifiables depuis l admin.
        </p>
      </article>

      <article className="reservation-box admin-settings-span-full">
        <h3 className="mb-3">{ts.ambianceGalleryTitle || 'Galerie Ambiance'}</h3>
        <form onSubmit={uploadGalleryImages} className="mb-3">
          <div className="mb-3">
            <input
              key={settingsGalleryInputKey}
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={(event) => setSettingsGalleryFiles(Array.from(event.target.files || []))}
            />
          </div>
          <button className="btn btn-outline-warning" type="submit">{ts.addGalleryImages || 'Ajouter images galerie'}</button>
        </form>

        <div className="admin-settings-gallery-grid">
          {settingsGalleryImages.map((item) => (
            <div className="admin-settings-gallery-item" key={item.id}>
              <img src={resolveImage(item.imagePath)} alt={`Gallery ${item.id}`} loading="lazy" decoding="async" />
              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteGalleryImage(item.id)}>{tp.delete || 'Supprimer'}</button>
            </div>
          ))}
        </div>
      </article>

      <article className="reservation-box admin-settings-span-full">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h3 className="m-0">{ts.servicesAndOffersTitle || 'Services Classiques & Offres Speciales'}</h3>
          <button className="btn btn-warning btn-sm" type="button" onClick={addServiceCard.bind(null, 'classic')}>
            {ts.addClassicCard || '+ Carte classique'}
          </button>
        </div>

        <form onSubmit={updateServicesContent} className="admin-service-editor-wrap">
          <div className="admin-service-editor-grid">
            <div>
              <p className="admin-service-editor-title">{ts.classicServices || 'Services Classiques'}</p>
              <div className="admin-service-editor-list">
                {settingsClassicServices.map((item, index) => (
                  <div className="admin-service-editor-card" key={`classic-${index}`}>
                    <div className="admin-service-editor-top">
                      <strong>Carte {index + 1}</strong>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeServiceCard('classic', index)}>{tp.delete || 'Supprimer'}</button>
                    </div>
                    <input className="form-control form-control-sm" placeholder="Kicker" value={item.kicker || ''} onChange={(event) => updateServiceCardField('classic', index, 'kicker', event.target.value)} />
                    <input className="form-control form-control-sm" placeholder="Titre" value={item.title || ''} onChange={(event) => updateServiceCardField('classic', index, 'title', event.target.value)} />
                    <textarea className="form-control form-control-sm" rows="2" placeholder="Description" value={item.text || ''} onChange={(event) => updateServiceCardField('classic', index, 'text', event.target.value)} />
                    {item.image ? (
                      <div className="admin-settings-logo-preview">
                        <img src={resolveImage(item.image)} alt={`Service classic ${index + 1}`} loading="lazy" decoding="async" />
                      </div>
                    ) : null}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*"
                        onChange={(event) => uploadServiceCardImage('classic', index, event.target.files?.[0] || null)}
                      />
                      <small className="text-light-emphasis">
                        {serviceImageUploadingKey === `classic-${index}` ? (ts.uploading || 'Televersement...') : (ts.uploadLocalImage || 'Televerser une image locale')}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <p className="admin-service-editor-title m-0">Offres Speciales</p>
                <button className="btn btn-warning btn-sm" type="button" onClick={addServiceCard.bind(null, 'special')}>
                  {ts.addSpecialOffer || '+ Offre speciale'}
                </button>
              </div>
              <p className="text-light-emphasis small mb-2">{ts.specialCardsHint || 'Ces cartes apparaissent dans la section "Moments Speciaux" de la page d accueil.'}</p>
              <div className="admin-service-editor-list">
                {settingsSpecialOffers.map((item, index) => (
                  <div className="admin-service-editor-card" key={`special-${index}`}>
                    <div className="admin-service-editor-top">
                      <strong>Offre {index + 1}</strong>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeServiceCard('special', index)}>{tp.delete || 'Supprimer'}</button>
                    </div>
                    <input className="form-control form-control-sm" placeholder="Kicker" value={item.kicker || ''} onChange={(event) => updateServiceCardField('special', index, 'kicker', event.target.value)} />
                    <input className="form-control form-control-sm" placeholder="Titre" value={item.title || ''} onChange={(event) => updateServiceCardField('special', index, 'title', event.target.value)} />
                    <textarea className="form-control form-control-sm" rows="2" placeholder="Description" value={item.text || ''} onChange={(event) => updateServiceCardField('special', index, 'text', event.target.value)} />
                    <input className="form-control form-control-sm" placeholder="Badge" value={item.badge || ''} onChange={(event) => updateServiceCardField('special', index, 'badge', event.target.value)} />
                    {item.image ? (
                      <div className="admin-settings-logo-preview">
                        <img src={resolveImage(item.image)} alt={`Offre speciale ${index + 1}`} loading="lazy" decoding="async" />
                      </div>
                    ) : null}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*"
                        onChange={(event) => uploadServiceCardImage('special', index, event.target.files?.[0] || null)}
                      />
                      <small className="text-light-emphasis">
                        {serviceImageUploadingKey === `special-${index}` ? (ts.uploading || 'Televersement...') : (ts.uploadLocalImage || 'Televerser une image locale')}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-warning" type="submit">{ts.saveServiceCards || 'Sauvegarder cartes services'}</button>
          </div>
        </form>
      </article>
    </div>
  );

  const renderProfilePage = () => (
    <div className="admin-profile-page">
      <article className="reservation-box admin-profile-hero">
        <div className="admin-profile-orb" aria-hidden="true" />
        <div className="admin-profile-id">
          <div className={`admin-profile-avatar-xl ${settingsProfilePhotoPath ? 'is-photo' : ''}`}>
            {settingsProfilePhotoPath ? (
              <img src={resolveImage(settingsProfilePhotoPath)} alt="Profil administrateur" loading="lazy" decoding="async" />
            ) : (
              <span>{(settingsDisplayName || 'A').trim().charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="admin-pro-kicker">{`${resolvedBrandName} Profil administrateur`}</p>
            <h3 className="m-0">{settingsDisplayName || 'Admin'}</h3>
            <small>{settingsEmail || 'admin@neonbite.com'}</small>
          </div>
        </div>
      </article>

      <div className="admin-profile-grid">
        <article className="reservation-box">
          <h3 className="mb-3">{ts.adminNameTitle || 'Nom Admin'}</h3>
          <form onSubmit={updateAdminDisplayName}>
            <div className="mb-3">
              <label className="form-label small mb-1">{ts.displayName || 'Nom affiche'}</label>
              <input
                type="text"
                className="form-control"
                value={settingsDisplayName}
                onChange={(event) => setSettingsDisplayName(event.target.value)}
                maxLength={80}
                required
              />
            </div>
            <button className="btn btn-warning" type="submit">{ts.saveName || 'Sauvegarder nom'}</button>
          </form>
        </article>

        <article className="reservation-box">
          <h3 className="mb-3">{ts.profilePhotoTitle || 'Photo de Profil'}</h3>
          {settingsProfilePhotoPath ? (
            <div className="admin-settings-logo-preview mb-3">
              <img src={resolveImage(settingsProfilePhotoPath)} alt="Photo de profil" loading="lazy" decoding="async" />
            </div>
          ) : (
            <p className="text-light-emphasis">{ts.noProfilePhoto || 'Aucune photo de profil.'}</p>
          )}
          <form onSubmit={updateAdminProfilePhoto}>
            <div className="mb-3">
              <input
                key={settingsProfilePhotoInputKey}
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(event) => setSettingsProfilePhotoFile(event.target.files?.[0] || null)}
              />
            </div>
            <button className="btn btn-outline-info" type="submit">{ts.changeProfilePhoto || 'Changer photo profil'}</button>
          </form>
        </article>
      </div>
    </div>
  );

  const renderActivePage = () => {
    if (activeSection === 'inventory') return renderInventoryPage();
    if (activeSection === 'orders') return renderOrdersPage();
    if (activeSection === 'messages') return renderMessagesPage();
    if (activeSection === 'comments') return renderCommentsPage();
    if (activeSection === 'settings') return renderSettingsPage();
    if (activeSection === 'profile') return renderProfilePage();
    return renderDashboardPage();
  };

  return (
    <section className={`container-fluid py-4 admin-workspace admin-section-${activeSection}`}>
      <div className="admin-layout admin-layout-topnav">
        <div className="admin-main">
          <header className="admin-topbar">
            <div className={`admin-profile-wrap-top ${profileMenuOpen ? 'is-open' : ''}`} ref={profileMenuRef}>
              <button
                type="button"
                className="admin-profile-card admin-profile-trigger"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                <div className={`admin-avatar ${settingsProfilePhotoPath ? 'is-photo' : ''}`}>
                  {settingsProfilePhotoPath ? (
                    <img src={resolveImage(settingsProfilePhotoPath)} alt={ts.adminProfileAlt || 'Profil administrateur'} loading="lazy" decoding="async" />
                  ) : (
                    (settingsDisplayName || 'A').trim().charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="m-0">{settingsDisplayName || 'Admin'}</h4>
                  <small>{settingsEmail || 'admin@neonbite.com'}</small>
                </div>
                <span className="admin-profile-caret" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {profileMenuOpen && (
                <div className="admin-profile-menu-top" role="menu" aria-label={ts.profileMenuLabel || 'Menu profil administrateur'}>
                  <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigateToSection('settings'); }}>
                    {ts.settings || 'Parametres'}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); navigateToSection('profile'); }}>
                    {ts.myProfile || 'Mon profil'}
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setProfileMenuOpen(false); onLogout(); }}>
                    {ts.logout || 'Deconnexion'}
                  </button>
                </div>
              )}
            </div>

            <div className="admin-top-right">
              <button className="admin-icon-btn" onClick={() => navigateToSection('comments')} aria-label={ts.adminNotificationsLabel || 'Notifications administrateur'}>
                <span className="admin-icon-badge">{pendingComments}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3a6 6 0 0 0-6 6v3.6l-1.6 2.7c-.3.6.1 1.2.8 1.2h13.6c.7 0 1.1-.6.8-1.2L18 12.6V9a6 6 0 0 0-6-6Zm0 18a2.8 2.8 0 0 0 2.6-1.8h-5.2A2.8 2.8 0 0 0 12 21Z" fill="currentColor" />
                </svg>
              </button>
              <button className="admin-icon-btn" onClick={() => navigateToSection('messages')} aria-label={ts.adminMessagesLabel || 'Messages administrateur'}>
                <span className="admin-icon-badge">{newContactMessages}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm2.1.5L12 11.6 18.9 7H5.1Zm13.9 2-6.4 4.3a1 1 0 0 1-1.2 0L5 9v8.5c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5V9Z" fill="currentColor" />
                </svg>
              </button>
              <div className="admin-search-wrap">
                <input
                  className="form-control admin-search"
                  placeholder={tp.searchPlaceholder || 'Rechercher...'}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </header>

          <div className="admin-top-nav mb-4">
            {ADMIN_SECTIONS.filter((section) => section.showInNav !== false).map((section) => (
              <button
                key={section.key}
                className={`admin-top-nav-link ${activeSection === section.key ? 'is-active' : ''}`}
                onClick={() => navigateToSection(section.key)}
              >
                <div className="admin-top-nav-row">
                  <span>{tp[`sectionLabel_${section.key}`] || section.label}</span>
                  {section.key !== 'dashboard' && section.key !== 'settings' && (
                    <span className="admin-top-nav-count">{sectionTotals[section.key] ?? 0}</span>
                  )}
                </div>
                <small>{tp[`sectionHint_${section.key}`] || section.hint}</small>
              </button>
            ))}
          </div>

          {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
          {renderActivePage()}
        </div>
      </div>
    </section>
  );
}




