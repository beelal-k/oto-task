import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { v4 as uuidv4 } from 'uuid';
import { SpendPointsDto } from './dto/spend-points.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TransactionService {
  constructor(private readonly userService: UserService) {}

  // Sample transaction data for testing
  private transactions: Transaction[] = [
    { _id: '1', payer: 'TEST', points: 200, timestamp: new Date('2024-05-02T14:00:00Z'), deprecated: false, user: '500' },
    { _id: '2', payer: 'TEST', points: -200, timestamp: new Date('2024-05-02T14:00:00Z'), deprecated: false, user: '500' },
    { _id: '3', payer: 'TEST', points: 100, timestamp: new Date('2024-06-02T14:00:00Z'), deprecated: false, user: '500' },
    { _id: '12', payer: 'SHOPIFY', points: 1000, timestamp: new Date('2024-07-02T14:00:00Z'), deprecated: false, user: '500' },
    { _id: '123', payer: 'EBAY', points: 200, timestamp: new Date('2024-06-30T11:00:00Z'), deprecated: false, user: '500' },
    { _id: '132', payer: 'SHOPIFY', points: -200, timestamp: new Date('2024-06-30T15:00:00Z'), deprecated: false, user: '500' },
    { _id: '13', payer: 'AMAZON', points: 10000, timestamp: new Date('2024-07-01T14:00:00Z'), deprecated: false, user: '500' },
    { _id: '312', payer: 'SHOPIFY', points: 300, timestamp: new Date('2024-06-30T10:00:00Z'), deprecated: false, user: '500' }
  ];

  /**
   * Creates a new transaction for the logged-in user
   * @param createTransactionDto - Data for creating the transaction
   * @returns Updated list of transactions
   */
  create(createTransactionDto: CreateTransactionDto) {
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
  }

  /**
   * Retrieves all transactions for the logged-in user
   * @returns Filtered list of user's transactions
   */
  findAll() {
    const loggedInUser = this.validateUserAuthentication('view transactions');
    return this.transactions.filter(transaction => transaction.user === loggedInUser._id);
  }

  /**
   * Finds a specific transaction by ID
   * @param id - Transaction ID to find
   * @returns Found transaction or undefined
   */
  findOne(id: string) {
    return this.transactions.find(transaction => transaction._id === id);
  }

  /**
   * Processes a points spending request
   * @param spendPointsDto - Points spending request data
   * @returns Array of spending records per payer
   */
  spend(spendPointsDto: SpendPointsDto) {
    const loggedInUser = this.validateUserAuthentication('spend points');
    let pointsToSpend = spendPointsDto.points;

    // Validate if user has sufficient points
    if (loggedInUser.totalPoints < pointsToSpend) {
      throw new Error('Insufficient points available to complete the transaction');
    }

    const { spendingRecord, remainingPoints } = this.processSpendingRequest(
      pointsToSpend,
      this.getValidTransactions()
    );

    // Ensure all points were successfully spent
    if (remainingPoints > 0) {
      throw new Error('Insufficient points available to complete the transaction');
    }

    // Update user's total points
    loggedInUser.totalPoints -= spendPointsDto.points;

    // Format and return the spending results
    return this.formatSpendingResults(spendingRecord);
  }

  /**
   * Calculates current points balance per payer
   * @returns Array of payer balances
   */
  balance(): Array<{ payer: string; points: number }> {
    const loggedInUser = this.validateUserAuthentication('view balance');
    const userTransactions = this.transactions.filter(transaction => transaction.user === loggedInUser._id);
    
    return this.calculatePayerBalances(userTransactions);
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
      .filter(t => !t.deprecated)
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
    const payerTotals = this.calculatePayerTotals(sortedTransactions);

    for (const transaction of sortedTransactions) {
      if (pointsToSpend <= 0) break;

      const currentSpent = spendingRecord.get(transaction.payer) || 0;
      const payerTotal = payerTotals.get(transaction.payer) || 0;

      if (payerTotal - currentSpent <= 0) continue;

      const pointsToDeduct = Math.min(
        transaction.points,
        pointsToSpend,
        payerTotal - currentSpent
      );

      if (pointsToDeduct <= 0) continue;

      this.updateSpendingRecord(spendingRecord, transaction.payer, pointsToDeduct);
      this.updateTransaction(transaction, pointsToDeduct);
      pointsToSpend -= pointsToDeduct;
    }

    return { spendingRecord, remainingPoints: pointsToSpend };
  }

  /**
   * Calculates total points per payer
   * @param transactions - Array of transactions
   * @returns Map of payer totals
   */
  private calculatePayerTotals(transactions: Transaction[]): Map<string, number> {
    const payerTotals = new Map<string, number>();
    for (const t of transactions) {
      payerTotals.set(t.payer, (payerTotals.get(t.payer) || 0) + t.points);
    }
    return payerTotals;
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
   * Updates a transaction after spending points
   * @param transaction - Transaction to update
   * @param pointsDeducted - Points being deducted
   */
  private updateTransaction(transaction: Transaction, pointsDeducted: number) {
    if (pointsDeducted >= transaction.points) {
      transaction.deprecated = true;
    } else {
      transaction.points -= pointsDeducted;
    }
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
   * Calculates balance for each payer
   * @param transactions - Array of transactions
   * @returns Array of payer balances
   */
  private calculatePayerBalances(transactions: Transaction[]): Array<{ payer: string; points: number }> {
    const result: Array<{ payer: string; points: number }> = [];
    const processedPayers = new Set<string>();

    for (const transaction of transactions) {
      const payer = transaction.payer;
      if (!processedPayers.has(payer)) {
        const points = this.getTotalPayerPoints(transactions, payer);
        result.push({ payer, points });
        processedPayers.add(payer);
      }
    }

    return result;
  }

  /**
   * Calculates total points for a specific payer
   * @param transactions - Array of transactions
   * @param payer - Payer name
   * @returns Total points for the payer
   */
  private getTotalPayerPoints(transactions: Transaction[], payer: string): number {
    return transactions
      .filter(transaction => transaction.payer === payer && !transaction.deprecated)
      .reduce((acc, curr) => acc + curr.points, 0);
  }
}