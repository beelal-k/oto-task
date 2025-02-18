import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { v4 as uuidv4 } from 'uuid';
import { SpendPointsDto } from './dto/spend-points.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TransactionService {
  constructor(private readonly userService: UserService) { }

  // Sample transaction data for testing
  private transactions: Transaction[] = [
    { _id: '12', payer: 'SHOPIFY', points: 1000, timestamp: new Date('2024-07-02T14:00:00Z'), user: '500' },
    { _id: '123', payer: 'EBAY', points: 200, timestamp: new Date('2024-06-30T11:00:00Z'), user: '500' },
    { _id: '132', payer: 'SHOPIFY', points: -200, timestamp: new Date('2024-06-30T15:00:00Z'), user: '500' },
    { _id: '13', payer: 'AMAZON', points: 10000, timestamp: new Date('2024-07-01T14:00:00Z'), user: '500' },
    { _id: '312', payer: 'SHOPIFY', points: 300, timestamp: new Date('2024-06-30T10:00:00Z'), user: '500' }
  ];

  /**
   * Creates a new transaction for the logged-in user
   * @param createTransactionDto - Data for creating the transaction
   * @returns Updated list of transactions
   */
  create(createTransactionDto: CreateTransactionDto) {
    try {
      const loggedInUser = this.validateUserAuthentication('create transactions');

      const transaction = {
        ...createTransactionDto,
        _id: uuidv4(),
        deprecated: false,
        user: loggedInUser._id,
        timestamp: new Date()
      };

      this.transactions.push(transaction);
      loggedInUser.totalPoints += transaction.points;

      return this.transactions;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Retrieves all transactions for the logged-in user
   * @returns List of transactions for the logged-in user
   */
  findAll() {
    try {
      const loggedInUser = this.validateUserAuthentication('view transactions');
      return this.transactions.filter(transaction => transaction.user === loggedInUser._id);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Retrieves a transaction by ID
   * @param id - Transaction ID
   * @returns - Transaction object
   */
  findOne(id: string) {
    try {
      const transaction = this.transactions.find(transaction => transaction._id === id);
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * Spends points for the logged-in user
   * @param spendPointsDto 
   * @returns Spending record - Map<string, number>
   */
  spend(spendPointsDto: SpendPointsDto) {
    const pointsToSpend = spendPointsDto.points;

    if (!pointsToSpend || pointsToSpend <= 0) throw new Error("Points to spend must be greater than 0")

    const loggedInUser = this.validateUserAuthentication('spend points');
    let remainingPoints = pointsToSpend;

    if (loggedInUser.totalPoints < pointsToSpend) {
      throw new Error(`Insufficient points. Available: ${loggedInUser.totalPoints}, Requested: ${pointsToSpend}`);
    }
    const sortedTransactions = this.getValidTransactions();

    const { spendingRecord } = this.processSpendingRequest(remainingPoints, sortedTransactions)

    // format spendingRecord to json
    const spendingResults = this.formatSpendingResults(spendingRecord);

    // update loggedInUser totalPoints
    loggedInUser.totalPoints -= pointsToSpend;

    return spendingResults;
  }

  /**
   * Retrieves balance for the logged-in user
   * @returns Object with payer balances
   */
  balance(): { [payer: string]: number } {
    try {
      const loggedInUser = this.validateUserAuthentication('view balance');
      const userTransactions = this.transactions.filter(transaction => transaction.user === loggedInUser._id);
      return this.calculatePayerBalances(userTransactions);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Calculates balance for each payer
   * @param transactions - Array of transactions
   * @returns Object with payer balances
   */
  private calculatePayerBalances(transactions: Transaction[]): { [payer: string]: number } {
    const result: { [payer: string]: number } = {};

    for (const transaction of transactions) {
      const payer = transaction.payer;
      if (!(payer in result)) {
        result[payer] = this.getTotalPayerPoints(transactions, payer);
      }
    }

    return result;
  }

  /**
   * Validates user authentication and returns logged-in user
   * @param action - Action being performed (for error message)
   * @returns Logged-in user object
   */
  private validateUserAuthentication(action: string) {
    const loggedInUser = this.userService.getLoggedInUser();
    if (!loggedInUser) {
      throw new UnauthorizedException(`User must be logged in to ${action}`);
    }
    return loggedInUser;
  }

  /**
   * Retrieves valid (non-deprecated) transactions sorted by timestamp
   * @returns Sorted array of valid transactions
   */
  private getValidTransactions(): Transaction[] {
    return [...this.transactions]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Processes the spending request and updates transactions
   * @param pointsToSpend - Total points to spend
   * @param sortedTransactions - Sorted valid transactions
   * @returns Spending record and remaining points
   */
  private processSpendingRequest(pointsToSpend: number, sortedTransactions: Transaction[]) {
    const spendingRecord = new Map<string, number>();
    let remainingPointsToSpend = pointsToSpend;

    // Process transactions in chronological order
    for (const transaction of sortedTransactions) {
      if (remainingPointsToSpend <= 0) break;
      if (transaction.points == 0) continue; // Skip zero point transactions

      const pointsToDeduct = Math.min(transaction.points, remainingPointsToSpend);

      // Update spending record for this payer
      this.updateSpendingRecord(spendingRecord, transaction.payer, pointsToDeduct);

      // Create a new negative transaction
      const negativeTransaction = {
        _id: uuidv4(),
        payer: transaction.payer,
        points: -pointsToDeduct,
        timestamp: new Date(),
        deprecated: false,
        user: transaction.user
      };
      this.transactions.push(negativeTransaction);

      remainingPointsToSpend -= pointsToDeduct;
    }

    return { spendingRecord, remainingPoints: remainingPointsToSpend };
  }

  /**
   * Updates the spending record for a payer
   * @param spendingRecord - Current spending record
   * @param payer - Payer name
   * @param points - Points to add
   */
  private updateSpendingRecord(spendingRecord: Map<string, number>, payer: string, points: number) {
    spendingRecord.set(payer, (spendingRecord.get(payer) || 0) + points);
  }

  /**
   * Formats spending record into results array
   * @param spendingRecord - Map of spending records
   * @returns Formatted array of spending results
   */
  private formatSpendingResults(spendingRecord: Map<string, number>) {
    return Array.from(spendingRecord.entries()).map(([payer, points]) => ({
      payer,
      points: -points
    }));
  }

  /**
   * Calculates total points for a specific payer
   * @param transactions - Array of transactions
   * @param payer - Payer name
   * @returns Total points for the payer
   */
  private getTotalPayerPoints(transactions: Transaction[], payer: string): number {
    return transactions
      .filter(transaction => transaction.payer === payer)
      .reduce((acc, curr) => acc + curr.points, 0);
  }
}