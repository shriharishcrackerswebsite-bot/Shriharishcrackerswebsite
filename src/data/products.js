// Starter image catalog. The live shop reads Cloud Firestore. An administrator can add any of these that are missing; they are not inserted automatically.
export const categories = [
  { id: 'all', name: 'All Favourites', icon: '✦' }, { id: 'Combo Packs', name: 'Combo Packs', icon: '🎁' },
  { id: 'Flower Pots', name: 'Flower Pots', icon: '🌸' }, { id: 'Rockets', name: 'Rockets', icon: '🚀' },
  { id: 'Sparklers', name: 'Sparklers', icon: '✨' }, { id: 'Chakkars', name: 'Chakkars', icon: '💥' },
  { id: 'Fancy Crackers', name: 'Fancy', icon: '🎆' }, { id: 'Aerial Crackers', name: 'Aerial', icon: '🎇' },
];
export const products = [
  { id: 'family-festival', name: 'Family Festival Combo', category: 'Combo Packs', image: '/image.png', price: 999, originalPrice: 1299, discount: 23, badge: 'Best Seller', description: 'A cheerful festive selection for family celebrations.', highlights: ['Perfect for family celebrations', 'Premium festive selection'], theme: 'gold', featured: true },
  { id: 'grand-celebration', name: 'Grand Celebration Combo', category: 'Combo Packs', image: '/image.png', price: 1499, originalPrice: 1899, discount: 21, badge: 'Special Offer', description: 'A fuller mix for a memorable celebration.', highlights: ['Made for larger gatherings'], theme: 'pink' },
  { id: 'flower-delight', name: 'Flower Pot Delight', category: 'Flower Pots', image: '/image.png', price: 299, originalPrice: 350, discount: 15, badge: 'Festive Pick', description: 'A colourful choice for a warm festive evening.', highlights: ['Bright festive effect'], theme: 'orange' },
  { id: 'sky-rocket', name: 'Sky Rocket Pack', category: 'Rockets', image: '/image.png', price: 399, originalPrice: 475, discount: 16, badge: 'Popular', description: 'A sky-bound pick for celebratory moments.', highlights: ['Bright aerial effect'], theme: 'blue' },
  { id: 'golden-sparkler', name: 'Golden Sparklers', category: 'Sparklers', image: '/image.png', price: 199, originalPrice: 240, discount: 17, badge: 'Family Favourite', description: 'A warm and sparkling addition to your evening.', highlights: ['Easy festive favourite'], theme: 'gold' },
  { id: 'chakra-circle', name: 'Chakkar Circle', category: 'Chakkars', image: '/image.png', price: 249, originalPrice: 300, discount: 17, badge: 'Special Offer', description: 'A playful spinning celebration for the ground.', highlights: ['Classic celebration pick'], theme: 'purple' },
  { id: 'fancy-burst', name: 'Fancy Burst Box', category: 'Fancy Crackers', image: '/image.png', price: 799, originalPrice: 950, discount: 16, badge: 'New Pick', description: 'A premium box chosen for festive occasions.', highlights: ['Premium festive selection'], theme: 'pink' },
  { id: 'aerial-colour', name: 'Aerial Colour Show', category: 'Aerial Crackers', image: '/image.png', price: 899, originalPrice: 1099, discount: 18, badge: 'Celebration Pick', description: 'A colourful addition for special gathering moments.', highlights: ['Bright aerial effect'], theme: 'blue' },
];
