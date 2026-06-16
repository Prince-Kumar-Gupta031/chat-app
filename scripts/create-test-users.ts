import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john@drdo.intern',
        employeeId: 'EMP001',
        department: 'Engineering',
        password: 'password123',
      },
      {
        name: 'Jane Smith',
        email: 'jane@drdo.intern',
        employeeId: 'EMP002',
        department: 'Research',
        password: 'password123',
      },
      {
        name: 'Bob Johnson',
        email: 'bob@drdo.intern',
        employeeId: 'EMP003',
        department: 'Design',
        password: 'password123',
      },
    ];

    for (const user of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        console.log(`User ${user.email} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          department: user.department,
          password: hashedPassword,
          role: 'USER',
          status: 'PENDING', // These users will need admin approval
        },
      });

      console.log(`User ${user.name} created successfully`);
    }

    console.log('\nTest users created successfully!');
    console.log('Note: All test users are in PENDING status and need admin approval');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();