import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Logger } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountAdminResponse, CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard, Roles } from 'src/auth/roles/roles.guard';
import { UserRole } from 'src/users/schemas/user.schema';
import { AccountDocument } from './schemas/account.schema';

@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);
  constructor(private readonly accountService: AccountService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    // Use req.user.id for userId
    return this.accountService.create({
      ...createAccountDto,
      userId: req.user.id,
      userNumber: req.user.userNumber,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('myAccounts')
  getUserAccounts(@Request() req) {
    return this.accountService.findAccountsByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('findAll')
  async findAll(@Request() req) : Promise<AccountAdminResponse[]>{
    try {
      this.logger.log(`findAll account requests received`);
      return await this.accountService.findAllAdminResponse();
    } catch (err) {
      this.logger.error(`Error fetching accounts: ${err.message}`);
      throw err;
    }
    
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Patch('updateAccount')
  update(@Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.update(updateAccountDto);
  }
  // fetch (ip + account/1273)
  @UseGuards(JwtAuthGuard)
  @Delete(':accountId')
  async remove(@Param('accountId') accountId: string) {
    try {
      await this.accountService.deleteAccount(accountId);
      return { statusCode: 200, message: `Account deleted successfully` };
    } catch (error) {
      return { statusCode: 400, message: error.message || 'Failed to delete account' };
    }
  }
}
