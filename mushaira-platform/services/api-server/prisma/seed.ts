import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { mobile_number: process.env.SUPER_ADMIN_MOBILE ?? '+919999999999' },
    update: {},
    create: {
      mobile_number: process.env.SUPER_ADMIN_MOBILE ?? '+919999999999',
      full_name: process.env.SUPER_ADMIN_NAME ?? 'Platform Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.mobile_number);

  // Default Organiser — Jashn-e-Urdu
  const organiser = await prisma.organiser.upsert({
    where: { email: 'admin@jashneurdu.org' },
    update: {},
    create: {
      name: 'Jashn-e-Urdu',
      email: 'admin@jashneurdu.org',
      mobile: '+919000000000',
      website: 'https://jashneurdu.org',
      description: 'An organization dedicated to celebrating classical poetry and literary arts.',
    },
  });
  console.log('✅ Organiser created:', organiser.name);

  // Default Categories
  const categories = [
    { name: 'General', description: 'Standard entry', color: '#5B2C83' },
    { name: 'Premium', description: 'Premium seating', color: '#D4AF37' },
    { name: 'VIP', description: 'VIP access with backstage', color: '#C0392B' },
    { name: 'Staff', description: 'Event staff and volunteers', color: '#27AE60' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.name.toLowerCase() },
      update: {},
      create: { id: cat.name.toLowerCase(), ...cat },
    });
  }
  console.log('✅ Categories seeded');

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
