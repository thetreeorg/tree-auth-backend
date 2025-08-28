import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // ...existing endpoints...

  @Post('create-account')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        otpId: { type: 'string' },
        attrs: { type: 'object', additionalProperties: true },
      },
      required: ['otpId', 'attrs'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account created',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        applicationId: { type: 'string' },
      },
      required: ['email', 'applicationId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP requested',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        maxAttempts: { type: 'string' },
      },
    },
  })
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        otpId: { type: 'string' },
        otpCode: { type: 'string' },
      },
      required: ['otpId', 'otpCode'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        token: { type: 'string' },
      },
    },
  })
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
