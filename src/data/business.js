export const business = { name: 'Shri Harish Crackers', whatsapp: '919629917375', phones: ['9443184404', '9629917375'], address: 'Near Rotary Club, Eruvadi Main Road, Valliyur - 627117' };
export const directionsUrl = 'https://maps.app.goo.gl/K7isBvgQDZ2rGoCSA';
export const whatsappUrl = (message = 'Hello Shri Harish Crackers, I would like to know more about your crackers and offers.') => `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
