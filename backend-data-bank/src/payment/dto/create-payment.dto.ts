import { Length } from "class-validator"
import { Merchant } from "../entities/merchant.schema";
import { Product } from "../entities/product.schema";


export class CreatePaymentDto {

    cardNumber: string;

    @Length(3)
    cvv: number;
    
    password: string;
    
    merchantName: string;
    senderAccountNumber: string
    location: string
    currency: string
    device: string
    ipAddress: string
    product: Product;
    expiryDate: string;

}
