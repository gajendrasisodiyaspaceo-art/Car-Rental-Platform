import { connectDB, disconnectDB } from './config/db';
import { User } from './models/User';
import { VehicleCategory } from './models/VehicleCategory';
import { Branch } from './models/Branch';
import { Vehicle } from './models/Vehicle';
import { Discount } from './models/Discount';
import { TenantSettings } from './models/TenantSettings';

/** Minimal demo data so the apps have something to render. Idempotent-ish: wipes demo docs first. */
async function seed(): Promise<void> {
  await connectDB();

  await User.deleteMany({
    email: { $in: ['provider@demo.io', 'customer@demo.io', 'admin@demo.io'] },
  });

  await User.create({
    name: 'Platform Admin',
    email: 'admin@demo.io',
    password: 'password123',
    role: 'admin',
    isVerified: true,
  });

  const provider = await User.create({
    name: 'Demo Rentals',
    email: 'provider@demo.io',
    password: 'password123',
    role: 'provider',
    isVerified: true,
    approved: true,
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'customer@demo.io',
    password: 'password123',
    role: 'customer',
    isVerified: true,
  });

  // Full reset of demo collections (re-seeding creates a fresh provider id each run,
  // so a provider-scoped delete would orphan previous runs' data — wipe outright).
  await VehicleCategory.deleteMany({});
  await Branch.deleteMany({});
  await Vehicle.deleteMany({});
  await Discount.deleteMany({});

  await Discount.create([
    { providerId: provider.id, code: 'WELCOME10', type: 'percent', value: 10 },
    { providerId: provider.id, code: 'SUMMER20', type: 'percent', value: 20 },
  ]);

  await TenantSettings.deleteMany({});
  await TenantSettings.create({
    providerId: provider.id,
    appName: 'Demo Rentals',
    primaryColor: '#4f46e5',
    currency: 'USD',
    supportedLanguages: ['en', 'ar'],
    defaultLanguage: 'en',
    supportEmail: 'support@demo.io',
  });

  const [economy, sedan, suv, luxury, electric, convertible, van] =
    await VehicleCategory.create([
      { providerId: provider.id, name: 'Economy' },
      { providerId: provider.id, name: 'Sedan' },
      { providerId: provider.id, name: 'SUV' },
      { providerId: provider.id, name: 'Luxury' },
      { providerId: provider.id, name: 'Electric' },
      { providerId: provider.id, name: 'Convertible' },
      { providerId: provider.id, name: 'Van' },
    ]);

  const branch = await Branch.create({
    providerId: provider.id,
    name: 'Downtown',
    address: '1 Main St',
    city: 'Dubai',
    country: 'UAE',
  });

  // Stable Unsplash car photos (sized for cards).
  const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=60`;

  await Vehicle.create([
    {
      providerId: provider.id, categoryId: economy.id, branchId: branch.id,
      name: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: 2023, seats: 5,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 35, weekly: 210, monthly: 800 },
      features: ['Bluetooth', 'A/C', 'Cruise control'],
      images: [img('1542362567-b07e54358753')],
    },
    {
      providerId: provider.id, categoryId: economy.id, branchId: branch.id,
      name: 'Hyundai Accent', make: 'Hyundai', model: 'Accent', year: 2022, seats: 5,
      transmission: 'manual', fuelType: 'petrol',
      pricing: { daily: 28, weekly: 170, monthly: 640 },
      features: ['Bluetooth', 'A/C'],
      images: [img('1605559424843-9e4c228bf1c2')],
    },
    {
      providerId: provider.id, categoryId: sedan.id, branchId: branch.id,
      name: 'Honda Civic', make: 'Honda', model: 'Civic', year: 2023, seats: 5,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 45, weekly: 270, monthly: 1000 },
      features: ['Apple CarPlay', 'A/C', 'Lane assist'],
      images: [img('1503376780353-7e6692767b70')],
    },
    {
      providerId: provider.id, categoryId: suv.id, branchId: branch.id,
      name: 'Nissan Patrol', make: 'Nissan', model: 'Patrol', year: 2024, seats: 7,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 120, weekly: 700, monthly: 2600 },
      features: ['4WD', 'Leather seats', 'Sunroof'],
      images: [img('1568605117036-5fe5e7bab0b7')],
    },
    {
      providerId: provider.id, categoryId: suv.id, branchId: branch.id,
      name: 'Jeep Wrangler', make: 'Jeep', model: 'Wrangler', year: 2023, seats: 5,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 95, weekly: 570, monthly: 2100 },
      features: ['4WD', 'Removable top', 'Off-road tires'],
      images: [img('1511919884226-fd3cad34687c')],
    },
    {
      providerId: provider.id, categoryId: luxury.id, branchId: branch.id,
      name: 'Mercedes-Benz S-Class', make: 'Mercedes-Benz', model: 'S-Class', year: 2024, seats: 5,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 220, weekly: 1350, monthly: 5000 },
      features: ['Massage seats', 'Ambient lighting', 'Chauffeur mode'],
      images: [img('1549924231-f129b911e442')],
    },
    {
      providerId: provider.id, categoryId: luxury.id, branchId: branch.id,
      name: 'Lamborghini Huracán', make: 'Lamborghini', model: 'Huracán', year: 2023, seats: 2,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 600, weekly: 3800, monthly: 14000 },
      features: ['V10 engine', 'Carbon interior', 'Launch control'],
      images: [img('1552519507-da3b142c6e3d')],
    },
    {
      providerId: provider.id, categoryId: electric.id, branchId: branch.id,
      name: 'Tesla Model 3', make: 'Tesla', model: 'Model 3', year: 2024, seats: 5,
      transmission: 'automatic', fuelType: 'electric',
      pricing: { daily: 90, weekly: 540, monthly: 2000 },
      features: ['Autopilot', 'Glass roof', '350km range'],
      images: [img('1560958089-b8a1929cea89')],
    },
    {
      providerId: provider.id, categoryId: convertible.id, branchId: branch.id,
      name: 'Ford Mustang Convertible', make: 'Ford', model: 'Mustang', year: 2023, seats: 4,
      transmission: 'automatic', fuelType: 'petrol',
      pricing: { daily: 150, weekly: 900, monthly: 3300 },
      features: ['Soft top', 'V8 engine', 'Premium audio'],
      images: [img('1494976388531-d1058494cdd8')],
    },
    {
      providerId: provider.id, categoryId: van.id, branchId: branch.id,
      name: 'Toyota Hiace', make: 'Toyota', model: 'Hiace', year: 2022, seats: 12,
      transmission: 'manual', fuelType: 'diesel',
      pricing: { daily: 80, weekly: 480, monthly: 1800 },
      features: ['12 seats', 'A/C', 'Large luggage'],
      images: [img('1606016159991-dfe4f2746ad5')],
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('[seed] done. admin@demo.io / provider@demo.io / customer@demo.io (password123)');
  await disconnectDB();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exit(1);
});
