import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStatus } from './schemas/transaction.schema';
import { FraudSystemService } from 'src/fraud-system/fraud-system.service';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class TransactionWorker {
  private readonly logger = new Logger(TransactionWorker.name);

  constructor(
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    private fraudSystemService: FraudSystemService,
    private accountService: AccountService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handlePendingTransactions() {
    try {
      const pendingTx = await this.txModel.findOne({ status: TransactionStatus.PENDING }).exec();

      if (!pendingTx) {
        
        return;
      }
      else if(pendingTx.invalidDetails){
        await this.fraudSystemService.createInvalidTransactionNode(pendingTx);
      }


      this.logger.log(`Processing transaction ${pendingTx._id}`);
 
      // 1. Validate with fraud system
      const fraudResult = await this.fraudSystemService.validate(pendingTx);

      // 2. Update snapshot with fraud results
      pendingTx.snapshot.fraudResult = fraudResult;
      pendingTx.snapshot.isFraud = fraudResult.isFraud;

      if (fraudResult.isFraud) {
        // 3a. Mark as failed if fraud detected
        pendingTx.status = TransactionStatus.FAILED;
        this.logger.warn(`Transaction ${pendingTx._id} flagged as FRAUD`);
      } else {
        // 3b. Process settlement if clean
        await this.accountService.settleTransaction(pendingTx.receiverId, pendingTx.senderId, pendingTx.snapshot.request.amount);
        pendingTx.status = TransactionStatus.COMPLETED;
        this.logger.log(`Transaction ${pendingTx._id} COMPLETED`);
      }

      // 4. Create Neo4j node for analysis
      try {
        await this.fraudSystemService.createTransactionNode(pendingTx);
        if(pendingTx.snapshot.fraudResult.behaviours.length > 0){
          await this.fraudSystemService.updateUserSuspiciousBehaviour(pendingTx);
        }
 
      } catch (neo4jError) {
        this.logger.error(`Neo4j node creation failed for ${pendingTx._id}:`, neo4jError);
        // Don't fail the transaction for Neo4j errors
      }

      // 5. Save the updated transaction
      await pendingTx.save();

    } catch (error) {
      this.logger.error('Error processing pending transactions:', error);
    }
  }

   
}