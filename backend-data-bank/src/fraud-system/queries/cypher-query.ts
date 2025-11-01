import { Neo4jService } from "src/database/neo4j/neo4j.service";
import { TransactionRequestDto } from "src/transaction/dto/transaction.dto";
import { FraudResult, SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { UserResponse } from "src/users/dto/user.dto";
import { AccountResponseDto } from "src/account/dto/account.dto";
import { UserDocument } from "src/users/schemas/user.schema";
import { AccountDocument } from "src/account/schemas/account.schema";
import { CardDocument } from "src/card/schemas/card.schema";
/**
 * Abstract base class for executing parameterized Cypher queries against a Neo4j service.
 *
 * @template T - The type of the data transfer object (DTO) supplied to the query.
 *
 * @remarks
 * Subclasses must implement the abstract getters `cypher` and `params` to provide the
 * Cypher query string and the corresponding parameters object. This class stores a
 * reference to the provided `Neo4jService` and the DTO. Calling `execute()` runs the
 * query via the service and populates `records` with the raw result returned by the
 * service.
 *
 * Implementors should keep query text and parameters immutable and side-effect free.
 *
 * @example
 * ```ts
 * class FindUserQuery extends CypherQuery<{ id: string }> {
 *   protected get cypher(): string {
 *     return 'MATCH (u:User {id: $id}) RETURN u';
 *   }
 *   protected get params(): any {
 *     return { id: this.dto.id };
 *   }
 * }
 * ```
 *
 * @param neo4jService - The Neo4j service instance used to perform the query.
 * @param dto - The DTO instance containing input values for the query.
 *
 * @property protected readonly service - The Neo4jService used to execute queries.
 * @property protected readonly dto - The DTO provided to the query implementation.
 * @property protected records - Populated with the raw query result after `execute()` completes.
 *
 * @returnsOnExecute
 * The `execute()` method returns a Promise that resolves to the raw records/result produced
 * by the underlying `Neo4jService.query` call.
 */
export abstract class CypherQuery<T> {

    protected abstract get cypher(): string;
    protected abstract get params(): any;
    protected readonly service: Neo4jService;

    protected readonly dto: T
    protected records: any

    constructor(neo4jService: Neo4jService, dto: T) {
        this.service = neo4jService;
        this.dto = dto;
    }
    async execute() {
        this.records = await this.service.query(this.cypher, this.params);
        return this.records;
    }
}
export class CreateUserNode extends CypherQuery<UserDocument> {
    protected get cypher(): string {
        return `
        CREATE (u:User {
        rut: $rut
        userNumber: $userNumber

        })
        RETURN u
        `
    }
    protected get params(): any {
        return {
            rut: this.dto.rut,
            userNumber: this.dto.userNumber,
        }
    }

}
export class UpdateUserNode extends CypherQuery<UserDocument> {
    protected get cypher(): string {
        return `
        MATCH (u:User)
        WHERE ($userNumber IS NULL OR u.userNumber = $userNumber)
          AND ($rut IS NULL OR u.rut = $rut)
        SET u += $props
        RETURN u
        `
    }
    protected get params(): any {
        const { rut, userNumber, ...props } = (this.dto as any) || {};
        return {
            rut: rut ?? null,
            userNumber: userNumber ?? null,
            props
        }
    }
}
export class CreateAccountNode extends CypherQuery<AccountDocument> {
    protected get cypher(): string {
        return `
        MATCH (u: User)
        WHERE u.userNumber = $userNumber
        CREATE (a: Account {accountNumber: $accountNumber,type: $accountType, bankBranch:$bankBranch } )
        CREATE (u)-[o:OWNS]->(a)
        return o`
    }
    protected get params(): any {
        return {
            userNumber: this.dto.userNumber,
            accountNumber: this.dto.accountNumber,
            bankBranch: this.dto.bankBranch,
        }
    }

}
export class UpdateAccountNode extends CypherQuery<AccountDocument> {
    protected get cypher(): string {
        return `
        MATCH (u:User)
        WHERE ($userNumber IS NULL OR u.userNumber = $userNumber)
        MERGE (a:Account {accountNumber: $accountNumber})
        ON CREATE SET a.createdAt = datetime()
        SET a += $props
        MERGE (u)-[o:OWNS]->(a)
        RETURN a, o
        `
    }
    protected get params(): any {
        const { userNumber, accountNumber, accountType, bankBranch, ...rest } = (this.dto as any) || {};
        const props: any = { ...rest };
        if (accountType !== undefined) props.type = accountType;
        if (bankBranch !== undefined) props.bankBranch = bankBranch;
        return {
            userNumber: userNumber ?? null,
            accountNumber,
            props
        }
    }

}
 

export class CreateCardNode extends CypherQuery<CardDocument> {
    protected get cypher(): string {
        return `
        MATCH (a: Account)
        WHERE a.accountNumber = $accountNumber
        CREATE (c: Card {number: $number,type: $cardType} )
        CREATE (a)-[h:HAS]->(c)
        return h`
    }
    protected get params(): any {
        return {
            accountNumber: this.dto.accountNumber,
            number: this.dto.number,
            type: this.dto.type,

        }
    }
}
 
export class UpdateCardNode extends CypherQuery<CardDocument> {
    protected get cypher(): string {
        return `
        MATCH (c:Card)
        WHERE ($number IS NULL OR c.number = $number)
        SET c += $props
        RETURN c
        `
    }
    protected get params(): any {
        const { number, type, ...rest } = (this.dto as any) || {};
        const props: any = { ...rest };
        if (type !== undefined) props.type = type;
        return {
            number: number ?? null,
            props
        }
    }
}

export class CreateTransactionNode extends CypherQuery<TransactionDocument> {

    get cypher() {
        return ``
        // return `
        //     // First, find or create User nodes based on account ownership
        //     MERGE (senderUser:User {id: $senderUserId})
        //     ON CREATE SET 
        //         senderUser.createdAt = datetime(),
        //         senderUser.type = 'USER'
            
        //     MERGE (receiverUser:User {id: $receiverUserId}) 
        //     ON CREATE SET 
        //         receiverUser.createdAt = datetime(),
        //         receiverUser.type = 'USER'
            
        //     // Find or create Account nodes
        //     MERGE (senderAccount:Account {
        //         accountNumber: $senderAccountNumber,
        //         userId: $senderUserId
        //     })
        //     ON CREATE SET 
        //         senderAccount.createdAt = datetime(),
        //         senderAccount.type = $senderAccountType,
        //         senderAccount.bankBranch = $senderBankBranch
            
        //     MERGE (receiverAccount:Account {
        //         accountNumber: $receiverAccountNumber,
        //         userId: $receiverUserId
        //     })
        //     ON CREATE SET 
        //         receiverAccount.createdAt = datetime(),
        //         receiverAccount.type = $receiverAccountType,
        //         receiverAccount.bankBranch = $receiverBankBranch
            
        //     // Create the Transaction node
        //     CREATE (transaction:Transaction {
        //         id: $transactionId,
        //         amount: $amount,
        //         type: $transactionType,
        //         status: $status,
        //         description: $description,
        //         merchantCategory: $merchantCategory,
        //         location: $location,
        //         currency: $currency,
        //         device: $device,
        //         createdAt: datetime($createdAt),
        //         date: $transactionDate,
        //         time: $transactionTime
        //     })
            
        //     // Create relationships
        //     CREATE (senderUser)-[:OWNS]->(senderAccount)
        //     CREATE (receiverUser)-[:OWNS]->(receiverAccount)
        //     CREATE (senderAccount)-[:SENT {
        //         amount: $amount,
        //         timestamp: datetime($createdAt),
        //         status: $status,
        //         transactionType: $transactionType
        //     }]->(transaction)
        //     CREATE (transaction)-[:RECEIVED_BY {
        //         amount: $amount,
        //         timestamp: datetime($createdAt),
        //         status: $status
        //     }]->(receiverAccount)
        //     CREATE (senderUser)-[:INITIATED {
        //         amount: $amount,
        //         timestamp: datetime($createdAt)
        //     }]->(transaction)
        //     CREATE (transaction)-[:BENEFITED]->(receiverUser)
            
        //     // Return the created transaction and related nodes
        //     RETURN transaction, senderAccount, receiverAccount, senderUser, receiverUser
        // `;
    }

    get params() {
        const snapshot = this.dto.snapshot;
        const request = snapshot.request;

        return {
            // // Transaction data
            // transactionId: this.dto.id.toString(),
            // amount: request.amount,
            // transactionType: request.type,
            // status: this.dto.status,
            // description: request.description,
            // merchantCategory: request.merchantCategory,
            // location: request.location,
            // currency: request.currency,
            // device: request.device,
            // createdAt: new Date().toISOString(),
            // transactionDate: new Date().toISOString(),
            // transactionTime: new Date().toTimeString().split(' ')[0],

            // // Sender data
            // senderUserId: snapshot.senderAccount.userId,
            // senderAccountNumber: snapshot.senderAccount.accountNumber,
            // senderAccountType: snapshot.senderAccount.type,
            // senderBankBranch: snapshot.senderAccount.bankBranch,

            // // Receiver data
            // receiverUserId: snapshot.receiverAccount.userId,
            // receiverAccountNumber: snapshot.receiverAccount.accountNumber,
            // receiverAccountType: snapshot.receiverAccount.type,
            // receiverBankBranch: snapshot.receiverAccount.bankBranch,
        };
    }
}


