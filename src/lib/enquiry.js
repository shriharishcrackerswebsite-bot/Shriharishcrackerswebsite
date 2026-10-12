import { money } from './money';

export function validateCustomer(name, phone) {
  const errors = {};
  const cleanName = name.trim();
  const cleanPhone = phone.trim().replace(/[\s()-]/g, '');
  if (!cleanName) errors.name = 'Please enter your full name.';
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) errors.phone = 'Please enter a valid 10-digit mobile number.';
  return { errors, cleanName, cleanPhone };
}

export function productListTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function buildProductListEnquiry({ name, phone, address, items }) {
  const total = productListTotal(items);
  const cleanAddress = address.trim();
  const message = [
    'Hello Shri Harish Crackers,',
    '',
    'I would like to make an enquiry regarding the following product list:',
    '',
    'Customer Details',
    `Name: ${name}`,
    `Phone: ${phone.trim()}`,
    ...(cleanAddress ? [`Delivery Address: ${cleanAddress}`] : []),
    '',
    'Product List',
    '',
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.name} × ${item.quantity}`,
      `Price: ${money.format(item.price * item.quantity)}`,
    ]),
    `Estimated Total: ${money.format(total)}`,
    '',
    'Please confirm availability and the next steps.',
    '',
    'Thank you.',
  ].join('\n');

  return { total, message };
}
