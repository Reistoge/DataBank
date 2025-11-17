import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
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
    return this.cardService.findCardsByAccountId(accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateCard')
  async update(
    @Body() updateCardDto: UserUpdateCardReqDto,
    @Body('accessPassword') accessPassword: string,
  ) {
    // structure: JSON containing the dto and the password above
    return await this.cardService.updateCard(accessPassword, updateCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':cardId')
  async remove(
    @Param('cardId') id: string,
    @Query('password') password: string,
  ) {
    // structure of url : `${API_BASE_URL + CARD_ROUTES.DELETE_CARD}/${cardId}?password=${accessPassword}`,
    try {
      await this.cardService.deleteCard(id, password);
      return { statusCode: 200, message: 'Card deleted succesfully' };
    } catch (err) {
      return {
        statuscode: 400,
        message: err instanceof Error ? err.message : 'Failed to delete card',
      };
    }
  }
}
