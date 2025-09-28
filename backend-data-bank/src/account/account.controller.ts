import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountReqDto, CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(createAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('myAccounts')
  getUserAccounts(@Body() user: AccountReqDto) {
    return this.accountService.getUserAccounts(user);

  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateAccount')
  update(
    @Body() updateAccountDto: UpdateAccountDto ,
   ) {
    return this.accountService.update(updateAccountDto);
  }


  @UseGuards(JwtAuthGuard)
  @Delete('deleteCard')
  remove(@Body() account: AccountReqDto) {
    return this.accountService.remove(account);
  }
}
