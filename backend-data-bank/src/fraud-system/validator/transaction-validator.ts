// backend-data-bank/src/fraud-system/validator/transaction-validator.ts
import { Inject, Injectable, Logger } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";
// REMOVE all other imports

@Injectable() // <-- MAKE IT INJECTABLE
export class TransactionValidator {
    private readonly logger = new Logger(TransactionValidation.name);
    constructor(
        @Inject('TRANSACTION_VALIDATIONS') 
        private validations: TransactionValidation[]
    ) { }

    async runAll(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
        this.logger.log(`Running all validations`);
        const results = await Promise.all(this.validations.map(s => s.validate(tx)));
        this.logger.log(`finished`);
        return results.flat();
    }
}