import { connectDB, disconnectDB } from './config/db';
import { User } from './models/User';
import { VehicleCategory } from './models/VehicleCategory';
import { Branch } from './models/Branch';
import { Vehicle } from './models/Vehicle';

/** Minimal demo data so the apps have something to render. Idempotent-ish: wipes demo docs first. */
async function seed(): Promise<void> {
  await connectDB();

  await Promise.all([
    User.deleteMany({ email: { $in: ['provider@demo.io', 'customer@demo.io'] } }),
  ]);

  const provider = await User.create({
    name: 'Demo Rentals',
    email: 'provider@demo.io',
    password: 'password123',
    role: 'provider',
    isVerified: true,
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'customer@demo.io',
    password: 'password123',
    role: 'customer',
    isVerified: true,
  });

  await VehicleCategory.deleteMany({ providerId: provider.id });
  await Branch.deleteMany({ providerId: provider.id });
  await Vehicle.deleteMany({ providerId: provider.id });

  const [economy, suv] = await VehicleCategory.create([
    { providerId: provider.id, name: 'Economy' },
    { providerId: provider.id, name: 'SUV' },
  ]);

  const branch = await Branch.create({
    providerId: provider.id,
    name: 'Downtown',
    address: '1 Main St',
    city: 'Dubai',
    country: 'UAE',
  });

  await Vehicle.create([
    {
      providerId: provider.id,
      categoryId: economy.id,
      branchId: branch.id,
      name: 'Toyota Corolla',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      seats: 5,
      transmission: 'automatic',
      fuelType: 'petrol',
      pricing: { daily: 35, weekly: 210, monthly: 800 },
      features: ['Bluetooth', 'A/C', 'Cruise control'],
    },
    {
      providerId: provider.id,
      categoryId: suv.id,
      branchId: branch.id,
      name: 'Nissan Patrol',
      make: 'Nissan',
      model: 'Patrol',
      year: 2024,
      seats: 7,
      transmission: 'automatic',
      fuelType: 'petrol',
      pricing: { daily: 120, weekly: 700, monthly: 2600 },
      features: ['4WD', 'Leather seats', 'Sunroof'],
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('[seed] done. provider@demo.io / customer@demo.io (password123)');
  await disconnectDB();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed', err);
  process.exit(1);
});
