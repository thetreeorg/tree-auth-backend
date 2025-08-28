import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ApplicationController } from './application/application.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [AuthModule, UserModule, OrganizationModule],
  controllers: [AppController, ApplicationController],
  providers: [AppService],
})
export class AppModule {}
