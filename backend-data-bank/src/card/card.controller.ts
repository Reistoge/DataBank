import { Controller, Post, Body, UseGuards, Get, Request, Logger, Patch, Param, Delete } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto, UserUpdateCardReqDto, UserCardReqDto } from './dto/card.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserResponse } from 'src/users/dto/user.dto';

@Controller('card')
export class CardController {
  private readonly logger = new Logger(CardController.name);
  constructor(private readonly cardService: CardService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('myCards')
  getUserCards(@Body() user: UserCardReqDto) {
    return this.cardService.getUserCards(user);

  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateCard')
  update(
    @Body() updateCardDto: UserUpdateCardReqDto,
    @Body('accessPassword') accessPassword: string,
  ) {
    return this.cardService.update(accessPassword, updateCardDto);
  }
  

  @UseGuards(JwtAuthGuard)
  @Delete('deleteCard')
  remove(@Body('id') id: string) {
    return this.cardService.remove(id);
  }
}
