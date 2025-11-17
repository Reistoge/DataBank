import {
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './schemas/user.schema';
import { RoleGuard, Roles } from 'src/auth/roles/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('allUsers')
  async findAll() {
    this.logger.log('Fetching all users');
    const users = await this.userService.findAllUsers();
    return { statusCode: 200, data: users };
  }

  @Patch('giveAdmin/:userRut')
  async giveAdmin(
    @Param('userRut') userRut: string,
    @Query('adminValidator') adminValidator: string,
  ) {
    if (adminValidator !== this.configService.get<string>('ADMIN_ACCESS')) {
      throw new ForbiddenException('Unauthorized');
    }

    const user = await this.userService.getUserDocumentByRut(userRut);
    const roles = user?.roles;
    if (!roles?.includes(UserRole.ADMIN)) {
      roles?.push(UserRole.ADMIN);
      const newUser = await this.userService.updateUserById(user?.id, user);
      return {
        statusCode: 200,
        message: `User data successfully updated ${newUser}`,
      };
    } else {
      return {
        statusCode: 200,
        message: `User already has admin role ${user}`,
      };
    }
  }
}
