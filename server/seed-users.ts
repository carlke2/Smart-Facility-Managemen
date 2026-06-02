import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedUser(name: string, email: string | undefined, passwordRaw: string | undefined, role: Role) {
  if (!email || !passwordRaw) {
    console.warn(`[!] Skipping ${role} seed - missing credentials in .env`);
    return;
  }

  console.log(`Hashing password for ${email} (${role})...`);
  const hashedPassword = await bcrypt.hash(passwordRaw, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: role,
      isActive: true,
      isEmailVerified: true,
      name,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: role,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`[+] Seeded ${role}: ${user.email}`);
  return user;
}

async function main() {
  console.log('--- STARTING USER SEEDING ---');

  await seedUser(
    'Alex Mutua (Admin)',
    process.env.SEED_ADMIN_EMAIL,
    process.env.SEED_ADMIN_PASSWORD,
    Role.ADMIN
  );

  await seedUser(
    'Facility Manager',
    process.env.SEED_FACILITY_EMAIL,
    process.env.SEED_FACILITY_PASSWORD,
    Role.SECRETARY
  );

  await seedUser(
    'Support Coordinator',
    process.env.SEED_PM_EMAIL,
    process.env.SEED_PM_PASSWORD,
    Role.PM
  );

  await seedUser(
    'IT Technician',
    process.env.SEED_TECH_EMAIL,
    process.env.SEED_TECH_PASSWORD,
    Role.TECHNICIAN
  );

  await seedUser(
    'HR Manager',
    process.env.SEED_HR_EMAIL,
    process.env.SEED_HR_PASSWORD,
    Role.HR_MANAGER
  );

  await seedUser(
    'Jane Doe (Employee)',
    process.env.SEED_EMPLOYEE_EMAIL,
    process.env.SEED_EMPLOYEE_PASSWORD,
    Role.CLIENT
  );

  console.log('--- SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
