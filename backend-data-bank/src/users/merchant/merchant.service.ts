// backend-data-bank/src/users/merchant/merchant.service.ts
import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthUserPayloadDto } from 'src/auth/auth.service';
import {
  MerchantRepository,
  CreateMerchantDto,
} from 'src/payment/repository/merchant/merchant.repository';
import { UserService } from '../users.service';
import { MerchantResponseDto } from 'src/payment/dto/merchant.dto';
import { ProductResponseDto } from 'src/payment/dto/product.dto';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly merchantRepository: MerchantRepository,
    private readonly userService: UserService,
  ) {}

  async getMerchant(name: string): Promise<MerchantResponseDto> {
    return await this.merchantRepository.getMerchant(name);
  }

  async create(
    createMerchantDto: CreateMerchantDto,
    user: AuthUserPayloadDto,
  ): Promise<MerchantResponseDto> {
    try {
      if (
        await this.userService.hasAccount(
          createMerchantDto.accountNumber,
          user.userNumber,
        )
      ) {
        return await this.merchantRepository.create(createMerchantDto);
      } else {
        throw new UnauthorizedException(
          `account doesn't belong to user request`,
        );
      }
    } catch (err) {
      this.logger.error(`Error creating merchant: ${err}`);
      throw err instanceof HttpException
        ? err
        : new InternalServerErrorException(
            `Server error when creating merchant`,
          );
    }
  }

  async getProducts(): Promise<ProductResponseDto[]> {
    try {
      this.logger.log('Fetching all products');
      const products = await this.merchantRepository.getAllProducts();
      this.logger.log(`Found ${products.length} products`);
      return products;
    } catch (err) {
      this.logger.error(`Error fetching products: ${err}`);
      throw err instanceof HttpException
        ? err
        : new InternalServerErrorException('Failed to retrieve products');
    }
  }

  async getMerchants(): Promise<MerchantResponseDto[]> {
    try {
      this.logger.log('Fetching all merchants');
      const merchants = await this.merchantRepository.getAllMerchants();
      this.logger.log(`Found ${merchants.length} merchants`);
      return merchants;
    } catch (err) {
      this.logger.error(`Error fetching merchants: ${err}`);
      throw err instanceof HttpException
        ? err
        : new InternalServerErrorException('Failed to retrieve merchants');
    }
  }
}
