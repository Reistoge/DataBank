import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountService } from 'src/account/account.service';
import { TransactionDocument, TransactionStatus, Transaction } from './schemas/transaction.schema';
import { TransactionRequestDto, TransactionResponseDto, TransactionSnapshot } from './dto/transaction.dto';
import { PredictionInput } from 'src/fraud-system/dto/prediction.dto';
import { snapshot } from 'node:test';
import { AccountState, AccountType } from 'src/account/dto/account.dto';
import { CypherQuery, QueryTransactionHistory, TransactionHistoryResponseDto } from 'src/fraud-system/queries/cypher-query';
import { Neo4jService } from 'src/database/neo4j/neo4j.service';
export enum INVALID_REASON {
  INVALID_ACCOUNT = "INVALID_ACCOUNT",
  INVALID_AMOUNT = "INVALID_AMOUNT",

}
export enum INVALID_ACCOUNT_REASON {
  INVALID_SENDER = "INVALID_SENDER",
  INVALID_RECEIVER = "INVALID_RECEIVER",

}
export class InvalidDetails {


  failureReason: string

  failureType: INVALID_REASON

}

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
    private neo4jService: Neo4jService,
  ) { }

  async create(txRequestDto: TransactionRequestDto): Promise<TransactionResponseDto> {
    try {
      // 1. Validate both accounts
      const validSenderAccount = await this.accountService.isAccountValid(txRequestDto.senderAccountNumber);
      const validReceiverAccount = await this.accountService.isAccountValid(txRequestDto.receiverAccountNumber);

      if (!validSenderAccount || !validReceiverAccount) {

        this.logger.warn(`Invalid accounts: sender=${validSenderAccount}, receiver=${validReceiverAccount}`);
        // save the error 
        // this.handleInvalidAccountTransaction(txRequestDto, isReceiverValid, isSenderValid);


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
      const newTransaction = await this.buildTransactionDetails(txRequestDto);

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

  private async buildTransactionDetails(txRequestDto: TransactionRequestDto) :Promise<TransactionDocument>{
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
    return newTransaction;
  }

  async getTransactionHistory(accountNumber: string) : Promise<TransactionHistoryResponseDto> {

 
    try{
      this.logger.log(`invoking transaction history query for account ${accountNumber}`);
      const q : CypherQuery<string> =  new QueryTransactionHistory(this.neo4jService, accountNumber);
      const records = await q.execute() ;
      return records;
      

    }
    catch(err){
     
      this.logger.warn(`History Transaction query error`);
      throw err instanceof Error ? err : new Error(`QueryTransactionHistory error`);
     
    }
  }

  async handleInvalidAccountTransaction(tx: TransactionRequestDto, isReceiverValid: boolean, isSenderValid: boolean) {

    const failureReason = !isSenderValid ? INVALID_ACCOUNT_REASON.INVALID_SENDER : INVALID_ACCOUNT_REASON.INVALID_RECEIVER;
    const receiver = await this.accountService.getAccountDocumentByAccountNumber(tx.receiverAccountNumber);
    const sender = await this.accountService.getAccountDocumentByAccountNumber(tx.senderAccountNumber);
    const newTransaction: TransactionDocument = new this.txModel({
      receiverId: isReceiverValid ? receiver?._id : null,
      senderId: isSenderValid ? sender?._id : null,
      snapshot: {
        isFraud: false,
        request: tx,
        receiverAccount: receiver ? receiver : null,
        senderAccount: sender ? sender : null,

      },
      status: TransactionStatus.PENDING,
      invalidDetails: {
        failureReason: failureReason,
        failureType: INVALID_REASON.INVALID_ACCOUNT,

      }
    });

    await newTransaction.save();

    this.logger.warn(`Invalid transaction saved: ${failureReason}`, { transactionId: newTransaction._id });
  }



  async handleInvalidAmountTransaction(tx: TransactionRequestDto) {

    // Get account documents
    const receiver = await this.accountService.getAccountDocumentByAccountNumber(tx.receiverAccountNumber);
    const sender = await this.accountService.getAccountDocumentByAccountNumber(tx.senderAccountNumber);

    // Create prediction input
    //const predictionInput = await this.makePredictionInput(receiver, sender, txRequestDto);

    // Create snapshot
    const snapshot: TransactionSnapshot = {
      isFraud: false,
      request: tx,
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
      invalidDetails: {
        failureType: INVALID_REASON.INVALID_AMOUNT,
        failureReason: INVALID_REASON.INVALID_AMOUNT,

      }

    });

    await newTransaction.save();
    this.logger.log(`Transaction ${newTransaction._id} created with PENDING status`);
  }



  async findOne(id: string): Promise<TransactionResponseDto> {
    try {
      const tx = await this.txModel.findById(id).exec();
      if (!tx) throw new NotFoundException(`transaction not found`);
      return {
        transactionId: tx.id,
        status: tx.status,
        message: tx.snapshot.request.amount.toString(),

      }

    } catch (err) {
      this.logger.warn(`Transaction with id ${id} not found`);
      throw err;
    }
  }

  async findAll() {
    return this.txModel.find().lean<TransactionResponseDto>().exec();
  }

}
