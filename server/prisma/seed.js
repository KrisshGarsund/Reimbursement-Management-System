import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      country: 'United States',
      currency: 'USD',
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'John Admin',
      email: 'admin@acme.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Sarah Manager',
      email: 'manager@acme.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      isManagerApprover: true,
    },
  });

  // Create employee user
  const empPassword = await bcrypt.hash('employee123', 12);
  const employee = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Bob Employee',
      email: 'employee@acme.com',
      passwordHash: empPassword,
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  // Create a sequential approval rule
  await prisma.approvalRule.create({
    data: {
      companyId: company.id,
      stepOrder: 1,
      approverId: admin.id,
      ruleType: 'SEQUENTIAL',
    },
  });

  console.log('Seed complete!');
  console.log('---');
  console.log('Demo accounts:');
  console.log('  Admin:    admin@acme.com / admin123');
  console.log('  Manager:  manager@acme.com / manager123');
  console.log('  Employee: employee@acme.com / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
