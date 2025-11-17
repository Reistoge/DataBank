import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateMerchantDto } from 'src/payment/repository/merchant/merchant.repository';
import { MerchantService } from './merchant.service';
import { User } from '../decorator/user.guard';

@Controller('merchant')
export class MerchantController {


    constructor(private readonly merchantService: MerchantService) { }
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createMerchantDto: CreateMerchantDto, @User() user) {
        return await this.merchantService.create(createMerchantDto, user);

    }

    @Get('/merchants')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getMerchants() {
        return await this.merchantService.getMerchants();
    }

    @Get('/merchants/:name')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getMerchant(@Param('name') name: string) {
        return await this.merchantService.getMerchant(name);
    }

    @Get('/products')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProducts() {
        return await this.merchantService.getProducts();
    }


}
