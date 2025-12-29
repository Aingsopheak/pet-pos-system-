
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Puppy Kibble (5kg)',
    category: 'Dog Food',
    status: 'In Stock',
    stock: 45,
    supplierName: 'PurePet Nutritions',
    price: 34.99,
    barcode: '880123456701',
    image: 'https://picsum.photos/seed/dogfood/200/200'
  },
  {
    id: '2',
    name: 'Feather Wand Teaser Toy',
    category: 'Cat Toys',
    status: 'In Stock',
    stock: 120,
    supplierName: 'Joyous Pets',
    price: 8.50,
    barcode: '880123456702',
    image: 'https://picsum.photos/seed/cattoy/200/200'
  },
  {
    id: '3',
    name: 'Aquarium Filter Carbon',
    category: 'Fish Supplies',
    status: 'Low Stock',
    stock: 8,
    supplierName: 'AquaClear',
    price: 12.99,
    barcode: '880123456703',
    image: 'https://picsum.photos/seed/fish/200/200'
  },
  {
    id: '4',
    name: 'Organic Rabbit Hay',
    category: 'Small Animal',
    status: 'In Stock',
    stock: 25,
    supplierName: 'GreenFields',
    price: 15.00,
    barcode: '880123456704',
    image: 'https://picsum.photos/seed/rabbit/200/200'
  },
  {
    id: '5',
    name: 'Orthopedic Dog Bed (L)',
    category: 'Dog Supplies',
    status: 'In Stock',
    stock: 15,
    supplierName: 'RestfulPets',
    price: 89.99,
    barcode: '880123456705',
    image: 'https://picsum.photos/seed/dogbed/200/200'
  }
];

export const CATEGORIES = [
  'All',
  'Dog Food',
  'Dog Supplies',
  'Cat Food',
  'Cat Toys',
  'Fish Supplies',
  'Bird Supplies',
  'Small Animal'
];
