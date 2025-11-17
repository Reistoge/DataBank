import { HttpException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import { MerchantRepository, CreateMerchantDto } from 'src/payment/repository/merchant/merchant.repository';
import { UserService } from '../users.service';
import { MerchantResponseDto } from 'src/payment/dto/merchant.dto';
import { ProductResponseDto } from 'src/payment/dto/product.dto';

@Injectable()
export class MerchantService {



    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly userService: UserService,
    ) { }
    async getMerchant(name: string): Promise<MerchantResponseDto> {
        return await this.merchantRepository.getMerchant(name);
    }
    async create(createMerchantDto: CreateMerchantDto, user: AuthUserPayloadDto): Promise<MerchantResponseDto> {
        try {
            if (await this.userService.hasAccount(createMerchantDto.accountNumber, user.userNumber)) {
                return await this.merchantRepository.create(createMerchantDto);

            } else {
                throw new UnauthorizedException(`account doesnt belongs to user request`);
            }
        } catch (err) {
            throw err instanceof HttpException ? err : new InternalServerErrorException(`Server error when creating merchant`);
        }

    }
    async getProducts(): Promise<ProductResponseDto[]> {
        return await this.merchantRepository.getAllProducts();

    }
    async getMerchants(): Promise<MerchantResponseDto[]> {
        return await this.merchantRepository.getAllMerchants();

    }



}
