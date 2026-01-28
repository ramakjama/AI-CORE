import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Limpiar datos existentes
  console.log('Cleaning existing data...');
  // Comentado para evitar borrar en primer seed
  // await prisma.policy.deleteMany();
  // await prisma.customer.deleteMany();
  // await prisma.user.deleteMany();

  // Crear usuarios
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@aicore.com' },
      update: {},
      create: {
        email: 'admin@aicore.com',
        name: 'Admin User',
        role: 'ADMIN',
        createdAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'agent@aicore.com' },
      update: {},
      create: {
        email: 'agent@aicore.com',
        name: 'Agent User',
        role: 'AGENT',
        createdAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'client@aicore.com' },
      update: {},
      create: {
        email: 'client@aicore.com',
        name: 'Client User',
        role: 'CLIENT',
        createdAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Crear clientes
  console.log('Creating customers...');
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'customer1@example.com' },
      update: {},
      create: {
        name: 'Juan García López',
        email: 'customer1@example.com',
        phone: '+34 912 34 56 78',
        address: 'Calle Principal 123, Madrid',
        city: 'Madrid',
        postalCode: '28001',
        country: 'España',
        taxId: 'DNI123456789',
        createdAt: new Date(),
      },
    }),
    prisma.customer.upsert({
      where: { email: 'customer2@example.com' },
      update: {},
      create: {
        name: 'María Rodríguez Martínez',
        email: 'customer2@example.com',
        phone: '+34 913 45 67 89',
        address: 'Avenida Central 456, Barcelona',
        city: 'Barcelona',
        postalCode: '08001',
        country: 'España',
        taxId: 'DNI234567890',
        createdAt: new Date(),
      },
    }),
    prisma.customer.upsert({
      where: { email: 'customer3@example.com' },
      update: {},
      create: {
        name: 'Carlos Pérez Sánchez',
        email: 'customer3@example.com',
        phone: '+34 914 56 78 90',
        address: 'Paseo de la Castellana 789, Valencia',
        city: 'Valencia',
        postalCode: '46001',
        country: 'España',
        taxId: 'DNI345678901',
        createdAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${customers.length} customers`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
