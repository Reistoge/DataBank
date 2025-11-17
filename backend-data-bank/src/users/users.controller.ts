import { Body, Controller, Get, Logger, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { Contact, UserRole } from './schemas/user.schema';
import { RoleGuard, Roles } from 'src/auth/roles/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { User } from './decorator/user.guard';
import { get } from 'axios';

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


  @Post('contacts')
  @UseGuards(JwtAuthGuard)
  async addContact(@User() user: AuthUserPayloadDto, @Body() contact: Contact) {

    this.logger.log(`Adding contact for user ${user.userNumber}`);
    await this.userService.addContact(user.userNumber, contact);


  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  async getContacts(@User() user: AuthUserPayloadDto) {
    this.logger.log(`getting contacts for user ${user.userNumber}`);
    return await this.userService.getContacts(user.userNumber);
  }

  @Patch('contacts')
  @UseGuards(JwtAuthGuard)
  async updateContacts(@User() user: AuthUserPayloadDto, contacts: Contact[]) {
    this.logger.log(`update for user ${user.userNumber} contacts ${JSON.stringify(contacts)}`);
    return await this.userService.updateContacts(user.userNumber,contacts);
  }

  @Patch('giveAdmin/:userRut')
  async giveAdmin(@Param('userRut') userRut: string, @Query('adminValidator') adminValidator: string) {
    try {
      if (adminValidator === this.configService.get<string>('ADMIN_ACCESS')) {
        const user = await this.userService.getUserDocumentByRut(userRut);
        const roles = user?.roles;
        if (!roles?.includes(UserRole.ADMIN)) {
          roles?.push(UserRole.ADMIN);
          const newUser = await this.userService.updateUserById(user?.id, user);
          return { statusCode: 200, message: `User data successfully updated ${newUser}` };
        } else {
          return { statusCode: 200, message: `User already has admin role ${user}` };
        }
      }
      return { statusCode: 403, message: 'Unauthorized' };
    } catch (err) {
      this.logger.error('Error updating user role', err);
      return { statusCode: 500, message: 'Failed to update user role' };
    }
  }
}
