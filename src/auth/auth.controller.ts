import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  // ...existing endpoints...

  @Post('create-account')
  async createAccount(
    @Body('otpId') otpId: string,
    @Body('attrs') attrs: Record<string, any>,
  ) {
    if (!otpId || !attrs) {
      throw new BadRequestException('Token and attributes are required');
    }
    try {
      const session = await this.authService.createAccount(otpId, attrs);
      return {
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(
    @Body('email') email: string,
    @Body('applicationId') applicationId: string,
  ) {
    if (!email || !applicationId) {
      throw new BadRequestException('Email and applicationId are required');
    }
    const verificationCode = await this.authService.requestAuthorization(
      email,
      applicationId,
    );
    return {
      id: verificationCode.id,
      expiresAt: verificationCode.expiresAt,
      maxAttempts: process.env.OTP_MAX_ATTEMPTS,
    };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('otpId') otpId: string,
    @Body('otpCode') otpCode: string,
  ) {
    if (!otpId || !otpCode) {
      throw new BadRequestException('OTP id and code are required');
    }
    try {
      const result = await this.authService.verifyOtp(otpId, otpCode);
      if ('accessToken' in result) {
        // Session created
        return {
          accessToken: result.accessToken,
          expiresAt: result.expiresAt,
        };
      } else {
        // New verification for account creation
        return {
          token: result.id,
          expiresAt: result.expiresAt,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }
}
