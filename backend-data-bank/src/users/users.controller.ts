import { Controller, Get, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private userService: UsersService) {}

  @Get('allUsers')
  async findAll() {
    try {
      this.logger.log('Fetching all users');
      const users = await this.userService.findAllUsers();
      return { statusCode: 200, data: users };
    } catch (error) {
      this.logger.error('Error fetching users', error);
      return {
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }
}
