const menuItems = [
  {
    id: 1,
    name: 'Truffle Volcano Burger',
    description: 'Black brioche, aged beef, truffle aioli, smoked cheddar and crunchy onions.',
    category: 'Main',
    price: 16.5,
    spicyLevel: 2,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    name: 'Saffron Ocean Risotto',
    description: 'Creamy saffron rice, grilled shrimp, lemon zest and herb oil.',
    category: 'Main',
    price: 21,
    spicyLevel: 1,
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826a07c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    name: 'Atlas Fire Tacos',
    description: 'Slow-cooked lamb, roasted pepper salsa, jalapeno slaw and lime crema.',
    category: 'Street',
    price: 13,
    spicyLevel: 3,
    image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 4,
    name: 'Sunset Citrus Salad',
    description: 'Arugula, orange slices, feta clouds, pistachio crunch and honey vinaigrette.',
    category: 'Starter',
    price: 11,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 5,
    name: 'Midnight Pistachio Cheesecake',
    description: 'Silky cheesecake, pistachio crumble, dark berry glaze.',
    category: 'Dessert',
    price: 9,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 6,
    name: 'Smoked Date Mocktail',
    description: 'Date syrup, smoked cinnamon, sparkling citrus and mint.',
    category: 'Drink',
    price: 7,
    spicyLevel: 0,
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80'
  }
];

const specials = [
  {
    id: 'sp1',
    title: 'Chef Live Counter',
    text: 'Every Friday, taste 5 surprise bites prepared in front of you.',
    badge: 'LIMITED',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sp2',
    title: 'Sunset Terrace Dinner',
    text: 'Golden-hour menu with acoustic vibe and signature drinks.',
    badge: 'POPULAR',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sp3',
    title: 'After 10 PM Street Box',
    text: 'Late-night mini feast served in creative bento style.',
    badge: 'NEW',
    image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1200&q=80'
  }
];

module.exports = { menuItems, specials };
