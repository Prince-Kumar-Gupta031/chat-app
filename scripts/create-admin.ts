import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@drdo.intern' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@drdo.intern',
        employeeId: 'ADMIN001',
        department: 'IT',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@drdo.intern');
    console.log('Password: admin123');
    console.log('Employee ID: ADMIN001');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();