export const business = { name: 'Shri Harish Crackers', whatsapp: '919629917375', phones: ['9443184404', '9629917375'], address: 'Near Rotary Club, Eruvadi Main Road, Valliyur, Tirunelveli district, Tamil Nadu - 627117' };
export const directionsUrl = 'https://share.google/FeqKCSN24rvXkzKHw';
export const whatsappUrl = (message = 'Hello Shri Harish Crackers, I would like to know more about your crackers and offers.') => `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
