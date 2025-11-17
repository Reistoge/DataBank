// src/payment/repository/merchant/merchant.repository.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    Logger
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MerchantResponseDto } from "src/payment/dto/merchant.dto";
import { ProductResponseDto } from "src/payment/dto/product.dto";
import { Merchant, MerchantDocument } from "src/payment/entities/merchant.schema";
import { Product, ProductDocument } from "src/payment/entities/product.schema";

export class CreateMerchantDto {
    accountNumber: string;
    name: string;
    category: string;
    contact: string;
    email: string;
}

@Injectable()
export class MerchantRepository {
    private readonly logger = new Logger(MerchantRepository.name);

    constructor(
        @InjectModel(Merchant.name) private readonly merchantModel: Model<MerchantDocument>,
        @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    ) { }

    async getMerchantbyName(merchantName: string): Promise<Merchant> {
        if (!merchantName || typeof merchantName !== 'string') {
            throw new BadRequestException('Merchant name is required and must be a string');
        }

        try {
            const merchant = await this.merchantModel.findOne({ name: merchantName }).lean<Merchant>().exec();

            if (!merchant) {
                throw new NotFoundException(`Merchant '${merchantName}' does not exist`);
            }

            this.logger.log(`Merchant found: ${merchantName}`);
            return merchant;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Error getting merchant by name '${merchantName}': ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchant information');
        }
    }

    async create(dto: CreateMerchantDto): Promise<MerchantResponseDto> {
        if (!dto?.name || !dto?.accountNumber || !dto?.email) {
            throw new BadRequestException('Name, account number, and email are required');
        }

        try {
            // Check if merchant already exists
            const existingMerchant = await this.merchantModel.findOne({ name: dto.name }).exec();
            if (existingMerchant) {
                throw new ConflictException(`Merchant with name '${dto.name}' already exists`);
            }

            const newMerchant = await new this.merchantModel(dto).save();
            this.logger.log(`Merchant created: ${dto.name}`);
            return {
                name: newMerchant.name,
                category: newMerchant.category,
                contact: newMerchant.contact,
                email: newMerchant.email,


            };
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Error creating merchant: ${error?.message}`);
            throw new InternalServerErrorException('Failed to create merchant');
        }
    }

    async getAllMerchants(): Promise<MerchantResponseDto[]> {
        try {
            return await this.merchantModel.find().lean<MerchantResponseDto[]>().exec();
        } catch (error) {
            this.logger.error(`Error getting all merchants: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchants');
        }
    }
    async getMerchant(name?:string, accountNumber?:string):Promise<MerchantResponseDto>{
        if (!name && !accountNumber) {
            throw new BadRequestException('Either name or accountId must be provided');
        }

        try {
            const query = name ? { name } : { accountNumber: accountNumber };
            const merchant = await this.merchantModel.findOne(query).lean<MerchantResponseDto>().exec();

            if (!merchant) {
                throw new NotFoundException(`Merchant not found`);
            }

            this.logger.log(`Merchant retrieved: ${name || accountNumber}`);
            return merchant;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Error getting merchant: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchant');
        }
    }

    async getAllProducts(): Promise<ProductResponseDto[]> {
        try {
            return (await this.merchantModel.find().lean<ProductResponseDto[]>().exec());
        } catch (error) {
            this.logger.error(`Error getting all merchants: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchants');
        }
    }


    async findMerchantProductDocument(accountNumber: string, productsProps?: Partial<Product>): Promise<Product[]> {
        if (!accountNumber) {
            throw new BadRequestException('Account number is required');
        }

        try {
            const merchant = await this.merchantModel.findOne({ accountNumber }).exec();
            if (!merchant) {
                return []; // Return empty array if merchant not found
            }

            const filter = {
                ...Object.fromEntries(Object.entries(productsProps || {}).filter(([, v]) => v !== undefined)),
                merchantId: merchant.id.toString(),
            };

            return await this.productModel.find(filter).lean<Product[]>().exec();
        } catch (error) {
            this.logger.error(`Error finding merchant products: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchant products');
        }
    }
    async findMerchantDocument(merchantProps: Partial<Merchant>): Promise<Merchant[]> {
        if (!merchantProps) {
            throw new BadRequestException('Account number is required');
        }

        try {
            const filter = {
                ...Object.fromEntries(Object.entries(merchantProps || {}).filter(([, v]) => v !== undefined)),

            };
            const merchants = await this.merchantModel.find({ filter }).exec();
            if (!merchants) {
                return []; // Return empty array if merchant not found
            }
            return await merchants;
        } catch (error) {
            this.logger.error(`Error finding merchant products: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchant products');
        }
    }
    async findOneMerchantDocument(merchantProps: Partial<Merchant>): Promise<Merchant> {

        try {
            const filter = {
                ...Object.fromEntries(Object.entries(merchantProps || {}).filter(([, v]) => v !== undefined)),

            };
            const merchants = await this.merchantModel.findOne({ filter }).exec();
            if (!merchants) {
                throw new NotFoundException(`Merchant not found`)
            }
            return await merchants;
        } catch (error) {
            this.logger.error(`Error finding merchant products: ${error?.message}`);
            throw new InternalServerErrorException('Failed to retrieve merchant products');
        }
    }
}