import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@iskcon.org').toLowerCase().trim();
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Super Admin',
      cardType: 'BRAHMACHARI_S1',
    },
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'ADMIN',
      cardType: 'BRAHMACHARI_S1',
    },
  });

  console.log('✅ Admin account configured successfully in database:');
  console.log(`- Email: ${adminUser.email}`);
  console.log(`- Role: ${adminUser.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
