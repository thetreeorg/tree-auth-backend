import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PrismaClient } from '../../generated/prisma/client';

const prisma = new PrismaClient();

@ApiTags('Applications')
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
  @Get()
  @ApiHeader({
    name: 'x-api-secret',
    required: true,
    description: 'Master API secret',
  })
  @ApiResponse({
    status: 200,
    description: 'List of applications',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  async listApplications(@Headers('x-api-secret') apiSecret: string) {
    const masterSecret = process.env.MASTER_API_SECRET;
    if (!apiSecret || apiSecret !== masterSecret) {
      throw new ForbiddenException('Invalid API secret');
    }
    return prisma.application.findMany({
      select: { id: true, name: true },
    });
  }
}
