import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createToken, verifyToken } from '@/lib/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingEmployee = await db.user.findUnique({
      where: { employeeId: validatedData.employeeId },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user with PENDING status
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        employeeId: validatedData.employeeId,
        department: validatedData.department,
        password: hashedPassword,
        role: 'USER',
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        department: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin approval.',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}