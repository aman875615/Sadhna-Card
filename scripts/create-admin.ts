import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'av580731@gmail.com';
  const rawPassword = '7800093758';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Super Admin (Aman Verma)',
      cardType: 'BRAHMACHARI_S1',
      phone: '7800093758',
    },
    create: {
      name: 'Super Admin (Aman Verma)',
      email,
      passwordHash,
      role: 'ADMIN',
      cardType: 'BRAHMACHARI_S1',
      phone: '7800093758',
    },
  });

  console.log('✅ Admin account created/updated successfully in MongoDB:');
  console.log(`- Name: ${adminUser.name}`);
  console.log(`- Email: ${adminUser.email}`);
  console.log(`- Role: ${adminUser.role}`);
  console.log(`- ID: ${adminUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
