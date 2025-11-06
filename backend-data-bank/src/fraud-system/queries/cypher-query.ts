import { Neo4jService } from "src/database/neo4j/neo4j.service";
import { TransactionRequestDto } from "src/transaction/dto/transaction.dto";
import { FraudResult, SuspiciousBehaviour } from "../dto/fraud.dto";
import { TransactionDocument } from "src/transaction/schemas/transaction.schema";
import { UserResponse } from "src/users/dto/user.dto";
import { AccountResponseDto, AccountType } from "src/account/dto/account.dto";
import { UserDocument } from "src/users/schemas/user.schema";
import { AccountDocument } from "src/account/schemas/account.schema";
import { CardDocument } from "src/card/schemas/card.schema";
import { Result } from "nest-neo4j/dist";
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
    async execute(): Promise<any> {
        this.records = await this.service.query(this.cypher, this.params);
        return this.records;
    }
}
export class CreateUserNode extends CypherQuery<UserDocument> {
    protected get cypher(): string {
        return `
        CREATE (u:User {
        rut:$rut,
        userNumber:$userNumber
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
        MATCH (u:User)
        WHERE u.userNumber = $userNumber
        CREATE (a:Account {
            accountNumber: $accountNumber,
            type: $accountType, 
            bankBranch: $bankBranch 
        })
        CREATE (u)-[o:OWNS]->(a)
        RETURN a, o`
    }
    protected get params(): any {
        return {
            userNumber: this.dto.userNumber,
            accountNumber: this.dto.accountNumber,
            bankBranch: this.dto.bankBranch,
            accountType: this.dto.type
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
        CREATE (c: Card {number: $number,type: $type} )
        CREATE (c)-[h:BELONGS]->(a)
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

    protected get cypher(): string {
        return `
            MATCH (sender:Account) WHERE sender.accountNumber = $senderAccountNumber
            MATCH (receiver:Account) WHERE receiver.accountNumber = $receiverAccountNumber

            CREATE (sender)-[tx:TRANSACTION {
                transactionId: $transactionId,
                snapshot: $snapshot,
                status: $status,
                invalidDetails: $invalidDetails,
                createdAt: $createdAt
            }]->(receiver)
            
            RETURN sender, tx, receiver;
        `
    }

    protected get params(): any {
        const snapshot = this.dto.snapshot;

        return {
            // Core transaction properties from schema
            transactionId: this.dto.id.toString(),
            snapshot: JSON.stringify(snapshot), // Complete snapshot object
            status: this.dto.status.toString(), // TransactionStatus enum value
            invalidDetails: JSON.stringify(this.dto.invalidDetails) || null, // Optional InvalidDetails object

            // Metadata
            createdAt: new Date().toISOString(),

            // Account identifiers for relationship matching
            senderAccountNumber: snapshot.senderAccount.accountNumber,
            receiverAccountNumber: snapshot.receiverAccount.accountNumber,
        };
    }
}

export class CreateInvalidTransactionNode extends CypherQuery<TransactionDocument> {

    protected get cypher(): string {
        return `

            MATCH (sender:Account) WHERE sender.accountNumber = $senderAccountNumber
            MATCH (receiver:Account) WHERE receiver.accountNumber = $receiverAccountNumber

            CREATE (sender)-[tx:INVALID_TRANSACTION {
                transactionId: $transactionId,
                snapshot: $snapshot,
                status: $status,
                invalidDetails: $invalidDetails,
                createdAt: $createdAt,
             }]->(receiver)

            RETURN sender, tx, receiver;
        `
    }

    protected get params(): any {
        const snapshot = this.dto.snapshot;

        return {
            // Core transaction properties from schema
            transactionId: this.dto.id.toString(),
            snapshot: JSON.stringify(snapshot), // Complete snapshot object
            status: this.dto.status.toString(), // TransactionStatus enum value
            invalidDetails: JSON.stringify(this.dto.invalidDetails), // InvalidDetails object (required for invalid transactions)

            // Metadata
            createdAt: new Date().toISOString(),
            // Account identifiers for relationship matching
            senderAccountNumber: snapshot.senderAccount?.accountNumber || null,
            receiverAccountNumber: snapshot.receiverAccount?.accountNumber || null,
        };
    }
}

export class UpdateUserBehaviour extends CypherQuery<TransactionDocument> {

    protected get cypher(): string {
        return `
            MATCH (u:User)-[o:OWNS]->(a:Account)
            WHERE a.accountNumber = $accountNumber
            FOREACH (behaviour IN $behaviours |
                MERGE (b:SuspiciousBehaviour {
                    code: behaviour.code,
                    type: behaviour.code,
                    description: behaviour.description,
                    weight: behaviour.weight,
                    severity: behaviour.severity
                })
                CREATE (u)-[r:EXHIBITS {
                    detectedAt: behaviour.detectedAt,
                    weight: behaviour.weight,
                    severity: behaviour.severity,
                    context: behaviour.context,
                    explanation: behaviour.explanation
                }]->(b)
            )
            RETURN u, collect(b) as behaviours
        `
    }

    protected get params(): any {
        const snapshot = this.dto.snapshot;
        const fraudResult = snapshot.fraudResult;

        // Extract and format suspicious behaviours
        const behaviours = fraudResult?.behaviours?.map(behaviour => ({
            code: behaviour.code,
            description: behaviour.description,
            weight: behaviour.weight,
            severity: behaviour.severity,
            detectedAt: behaviour.detectedAt.toISOString(),
            context: behaviour.context || {},
            explanation: behaviour.getExplanation()
        })) || [];

        return {
            accountNumber: snapshot.senderAccount.accountNumber,
            behaviours: behaviours,
            detectedAt: new Date().toISOString()
        };
    }
}

export class TransactionHistoryResponseDto {
    tx: {
        amount: number;
        transactionType: string;
        transactionId: string;
        location: string;
        status: string;
        createdAt: string;
        description: string;
        device: string;
        merchantCategory: string;
        currency: string;
    }
    direction: string
}
export class QueryTransactionHistory extends CypherQuery<string> {



    protected get cypher(): string {
        return `
        CALL {
            MATCH (target:Account {accountNumber:$accountNumber})-[out:TRANSACTION]->(other)
            RETURN out.createdAt AS date, properties(out) AS tx, "OUT: " + other.accountNumber AS direction

            UNION ALL

            MATCH (other)-[gain:TRANSACTION]->(target:Account {accountNumber:$accountNumber})
            RETURN gain.createdAt AS date, properties(gain) AS tx, "GAIN: " + other.accountNumber AS direction
        }
        RETURN tx, direction
        ORDER BY date DESC;

        `
    }
    protected get params(): any {
        return {
            accountNumber: this.dto

        }
    }

    // Transform raw Neo4j result to DTO
    transformResult(records: any[]): TransactionHistoryResponseDto[] {
        return records.map(record => {
            const tx = record.get('tx');
            const direction = record.get('direction');
            return {
                tx,
                direction
            } as TransactionHistoryResponseDto;
        });
    }

    async execute(): Promise<TransactionHistoryResponseDto[]> {
        const records = await super.execute();
        return this.transformResult(records);
    }
}

