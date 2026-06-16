import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function approveTestUsers() {
  try {
    // Approve john and jane
    await prisma.user.updateMany({
      where: { email: { in: ['john@drdo.intern', 'jane@drdo.intern'] } },
      data: { status: 'APPROVED' },
    });

    console.log('Approved: john@drdo.intern and jane@drdo.intern');
    console.log('Bob Johnson (bob@drdo.intern) remains PENDING for testing approval workflow');
  } catch (error) {
    console.error('Error approving users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveTestUsers();