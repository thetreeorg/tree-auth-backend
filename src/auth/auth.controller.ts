import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

const prisma = new PrismaClient();

@Controller('auth')
export class AuthController {
  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('applicationId') applicationId: string,
  ) {
    if (!email || !applicationId) {
      throw new BadRequestException('Email and applicationId are required');
    }
    // Check if application exists
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app) {
      throw new BadRequestException('Invalid applicationId');
    }
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }
    // Check if user is already linked to this application
    const existingLink = await prisma.userApplication.findFirst({
      where: { userId: user.id, applicationId },
    });
    if (existingLink) {
      throw new BadRequestException(
        'User already registered for this application',
      );
    }
    // Link user to application
    await prisma.userApplication.create({
      data: { userId: user.id, applicationId },
    });
    // Optionally, send verification code here
    return {
      userId: user.id,
      applicationId,
      verificationRequired: false, // Set to true if you implement verification
    };
  }
}
