import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

dotenv.config();
const prisma = new PrismaClient();

async function main() {

  const adminName = process.env.ADMIN_NAME ?? 'Administrator';
  const adminPhone = process.env.ADMIN_PHONE ?? '+959000000000';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ayar-farm.local';
  const adminPasswordPlain = process.env.ADMIN_PASSWORD ?? 'admin123';

  const hashed = await bcrypt.hash(adminPasswordPlain, 10);

  // Upsert admin user by unique phone_number
  await prisma.users.upsert({
    where: { phone_number: adminPhone },
    update: {
      name: adminName,
      email: adminEmail,
      password: hashed,
      user_type: 'ADMIN',
      isVerified: true,
    },
    create: {
      name: adminName,
      phone_number: adminPhone,
      email: adminEmail,
      password: hashed,
      user_type: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('Admin account created/updated. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });