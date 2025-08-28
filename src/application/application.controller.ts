import {
  Controller,
  Post,
  Body,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

const prisma = new PrismaClient();

@Controller('applications')
export class ApplicationController {
  @Post()
  async createApplication(
    @Body('name') name: string,
    @Headers('x-api-secret') apiSecret: string,
  ) {
    const masterSecret = process.env.MASTER_API_SECRET;
    if (!apiSecret || apiSecret !== masterSecret) {
      throw new ForbiddenException('Invalid API secret');
    }
    if (!name) {
      throw new ForbiddenException('Application name is required');
    }
    const app = await prisma.application.create({
      data: { name },
    });
    return app;
  }
}
