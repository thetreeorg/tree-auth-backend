import { Injectable } from '@nestjs/common';
import {
  PrismaClient,
  VerificationCode,
  Session,
} from '../../generated/prisma';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  // ...existing code...

  async createAccount(
    otpId: string,
    attrs: Record<string, any>,
  ): Promise<Session> {
    // Get verification code and check availability
    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: { id: otpId },
    });
    if (
      !verificationCode ||
      verificationCode.expiresAt < new Date() ||
      verificationCode.attempts > Number(process.env.OTP_MAX_ATTEMPTS)
    ) {
      throw new Error('Token expired or max attempts reached');
    }
    // Get meta and check if user exists
    const meta = verificationCode.meta as { email: string };
    let user = await this.prisma.user.findUnique({
      where: { email: meta.email },
    });
    if (!user) {
      // Merge attrs with meta
      const userData = { ...attrs, ...meta };
      user = await this.prisma.user.create({ data: userData });
    }
    // Create session
    const session = await this.createSession(
      user.id,
      verificationCode.userApplicationId ?? undefined,
    );
    // Delete verification code
    await this.prisma.verificationCode.delete({ where: { id: otpId } });
    return session;
  }
  private prisma = new PrismaClient();

  async requestAuthorization(
    email: string,
    applicationId: string,
  ): Promise<VerificationCode> {
    // 1. Create metadata
    const meta = { email };
    // 2. Generate OTP
    const code = this.generateOtp();
    const expiresAt = new Date(
      Date.now() + Number(process.env.OTP_EXPIRE_MINUTES) * 60000,
    );
    // 3. Find user (do not create)
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    let userApp: import('../../generated/prisma').UserApplication | undefined =
      undefined;
    if (user) {
      // 4. Ensure userApplication exists for existing user
      const foundUserApp = await this.prisma.userApplication.findFirst({
        where: { userId: user.id, applicationId },
      });
      userApp = foundUserApp ?? undefined;
      if (!userApp) {
        userApp = await this.prisma.userApplication.create({
          data: { userId: user.id, applicationId },
        });
      }
    }
    // 5. Save verification code (userApplicationId may be undefined for new users)
    const verificationCode = await this.prisma.verificationCode.create({
      data: {
        code,
        expiresAt,
        meta,
        userApplicationId: userApp?.id,
      },
    });
    // 4. Send email (implement separately)
    // await sendEmail(email, code);
    return verificationCode;
  }

  private generateOtp(): string {
    const length = Number(process.env.OTP_LENGTH) || 6;
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join(
      '',
    );
  }

  async verifyOtp(
    otpId: string,
    otpCode: string,
  ): Promise<Session | VerificationCode> {
    // 1. Increment attempts
    await this.prisma.verificationCode.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
    // 2. Validate OTP
    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: { id: otpId },
    });
    if (
      !verificationCode ||
      verificationCode.expiresAt < new Date() ||
      verificationCode.attempts > Number(process.env.OTP_MAX_ATTEMPTS)
    ) {
      throw new Error('OTP expired or max attempts reached');
    }
    // 3. Compare code
    if (
      crypto.timingSafeEqual(
        Buffer.from(verificationCode.code),
        Buffer.from(otpCode),
      )
    ) {
      // 4. Invalidate code
      await this.prisma.verificationCode.delete({ where: { id: otpId } });
      // 5. Check user
      const meta = verificationCode.meta as { email: string };
      let user = await this.prisma.user.findUnique({
        where: { email: meta.email },
      });
      if (!user) {
        // Automatically create user with meta
        user = await this.prisma.user.create({ data: meta });
      }
      // Create session
      const session = await this.createSession(
        user.id,
        verificationCode.userApplicationId ?? undefined,
      );
      return session;
    }
    throw new Error('Invalid OTP');
  }

  async createSession(
    userId: string,
    userApplicationId?: string,
  ): Promise<Session> {
    const accessToken = crypto
      .randomBytes(Number(process.env.ACCESS_TOKEN_LENGTH) || 32)
      .toString('hex');
    const expiresAt = new Date(
      Date.now() + Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) * 60000,
    );
    return this.prisma.session.create({
      data: {
        userId,
        accessToken,
        expiresAt,
        userApplicationId,
      },
    });
  }
}
