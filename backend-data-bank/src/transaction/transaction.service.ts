import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountService } from 'src/account/account.service';
import { TransactionDocument, TransactionStatus, Transaction } from './schemas/transaction.schema';
import { TransactionRequestDto, TransactionResponseDto, TransactionSnapshot } from './dto/transaction.dto';
import { PredictionInput } from 'src/fraud-system/dto/prediction.dto';
import { snapshot } from 'node:test';

const amountError: TransactionResponseDto = {
  transactionId: '-1',
  status: TransactionStatus.FAILED,
  message: 'Insufficient balance',
};

const validationError: TransactionResponseDto = {
  transactionId: '-1',
  status: TransactionStatus.FAILED,
  message: 'Invalid account(s)',
};

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    private accountService: AccountService,
  ) { }

  async create(txRequestDto: TransactionRequestDto): Promise<TransactionResponseDto> {
    try {
      // 1. Validate both accounts
      const validSenderAccount = await this.accountService.isAccountValid(txRequestDto.senderAccountNumber);
      const validReceiverAccount = await this.accountService.isAccountValid(txRequestDto.receiverAccountNumber);

      if (!validSenderAccount || !validReceiverAccount) {

        this.logger.warn(`Invalid accounts: sender=${validSenderAccount}, receiver=${validReceiverAccount}`);
        // save the error 
        this.handleInvalidAccountTransaction(txRequestDto);
        return { ...validationError };
      }

      // 2. Check balance
      const accountBalance = await this.accountService.getAccountBalanceByAccountNumber(txRequestDto.senderAccountNumber);
      if (txRequestDto.amount > accountBalance) {
        this.logger.warn(`Insufficient balance: ${txRequestDto.amount} > ${accountBalance}`);
        // save the error
        this.handleInvalidAmountTransaction(txRequestDto);
        return { ...amountError };
      }
      

      // Get account documents
      const receiver = await this.accountService.getAccountDocumentByAccountNumber(txRequestDto.receiverAccountNumber);
      const sender = await this.accountService.getAccountDocumentByAccountNumber(txRequestDto.senderAccountNumber);

      // Create prediction input
      //const predictionInput = await this.makePredictionInput(receiver, sender, txRequestDto);

      // Create snapshot
      const snapshot: TransactionSnapshot = {
        isFraud: false,
        request: txRequestDto,
        receiverAccount: receiver,
        senderAccount: sender,
        //predictionInput,
      };

      // Save to DB as PENDING
      const newTransaction = new this.txModel({
        receiverId: receiver._id,
        senderId: sender._id,
        snapshot: snapshot,
        status: TransactionStatus.PENDING,
      });

      await newTransaction.save();
      this.logger.log(`Transaction ${newTransaction._id} created with PENDING status`);

      // 7. Return "202 Accepted" to the user immediately
      return {
        transactionId: newTransaction.id,
        status: newTransaction.status,
        message: 'Transaction is being processed.',
      };
    } catch (error) {
      this.logger.error('Transaction creation failed:', error);
      return {
        transactionId: '-1',
        status: TransactionStatus.FAILED,
        message: 'Transaction failed due to system error',
      };
    }
  }
  async handleInvalidAccountTransaction(tx: TransactionRequestDto) {
    //
  }
  async handleInvalidAmountTransaction(tx: TransactionRequestDto){
    //
  }



  async findOne(id: string): Promise<TransactionResponseDto> {
    try {
      const tx = await this.txModel.findById(id).exec();
      if(!tx) throw new NotFoundException(`transaction not found`);
      return {
        transactionId: tx.id,
        status: tx.status,
        message: tx.snapshot.request.amount.toString(),

      }

    } catch (err){
      this.logger.warn(`Transaction with id ${id} not found`);
      throw err;
    }
  }

  async findAll() {
    return this.txModel.find().lean<TransactionResponseDto>().exec();
  }

}
