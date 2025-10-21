import { Controller, Post, Body, UseGuards, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto, UserUpdateCardReqDto } from './dto/card.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('myCards')
  getAccountCards(@Query('accountId') accountId: string) {
    return this.cardService.getAccountCards(accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateCard')
  update(@Body() updateCardDto: UserUpdateCardReqDto, @Body('accessPassword') accessPassword: string) {
    // structure: JSON containing the dto and the password above
    return this.cardService.update(accessPassword, updateCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':cardId')
  remove(@Param('cardId') id: string, @Query('password') password: string) {
    // structure of url : `${API_BASE_URL + CARD_ROUTES.DELETE_CARD}/${cardId}?password=${accessPassword}`, 
    return this.cardService.removeCard(id,password);
  }
}
