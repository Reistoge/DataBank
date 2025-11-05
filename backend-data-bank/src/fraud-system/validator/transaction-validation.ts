import { Injectable } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { SuspiciousBehaviour } from "../dto/fraud.dto";

@Injectable()
export abstract class TransactionValidation {
    
    abstract validate(tx: TransactionDocument): Promise<SuspiciousBehaviour[]>;

}

