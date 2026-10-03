export const services = [
  { id: 'apparel',   slugs: { fo: '/klaedir',   en: '/en/apparel'   }, icon: 'shirt',    image: 'apparel',   key: 'services.apparel' },
  { id: 'equipment', slugs: { fo: '/utgerd',    en: '/en/equipment' }, icon: 'dumbbell', image: 'equipment', key: 'services.equipment' },
  { id: 'printing',  slugs: { fo: '/prenting',  en: '/en/printing'  }, icon: 'printer',  image: 'printing',  key: 'services.printing' },
  { id: 'clubshop',  slugs: { fo: '/club-shop', en: '/en/club-shop' }, icon: 'cart',     image: 'clubshop',  key: 'services.clubshop' },
];

export const serviceById = (id) => services.find((s) => s.id === id);

export const otherServices = (id) => services.filter((s) => s.id !== id);
