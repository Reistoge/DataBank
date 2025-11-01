// backend-data-bank/src/fraud-system/validator/transaction-validator.ts
import { Inject, Injectable } from '@nestjs/common'; // <-- ADD @Injectable
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionValidation } from "./transaction-validation";
// REMOVE all other imports

@Injectable() // <-- MAKE IT INJECTABLE
export class TransactionValidator {
    constructor(
        // This is magic: Nest will find all providers
        // that extend TransactionValidation and inject them as an array.
        @Inject(TransactionValidation) private readonly v: TransactionValidation[],
    ) { }

    async runAll(tx: TransactionDocument): Promise<SuspiciousBehaviour[]> {
        const results = await Promise.all(this.v.map(s => s.validate(tx)));
        return results.flat();
    }
}