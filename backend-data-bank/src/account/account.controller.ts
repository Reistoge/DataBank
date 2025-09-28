import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    // Use req.user.id for userId
    return this.accountService.create({
      ...createAccountDto,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('myAccounts')
  getUserAccounts(@Request() req) {
    return this.accountService.getUserAccounts(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateAccount')
  update(@Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.update(updateAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':accountId')
  remove(@Param('accountId') accountId: string) {
    return this.accountService.remove(accountId);
  }
}
