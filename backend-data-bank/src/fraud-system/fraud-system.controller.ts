import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FraudSystemService } from './fraud-system.service';
import { CreateFraudSystemDto } from './dto/create-fraud-system.dto';
import { UpdateFraudSystemDto } from './dto/update-fraud-system.dto';

@Controller('fraud-system')
export class FraudSystemController {
  constructor(private readonly fraudSystemService: FraudSystemService) {}

  @Post()
  create(@Body() createFraudSystemDto: CreateFraudSystemDto) {
    return this.fraudSystemService.create(createFraudSystemDto);
  }

  @Get()
  findAll() {
    return this.fraudSystemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fraudSystemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFraudSystemDto: UpdateFraudSystemDto) {
    return this.fraudSystemService.update(+id, updateFraudSystemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fraudSystemService.remove(+id);
  }
}
