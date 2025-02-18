import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SpendPointsDto } from './dto/spend-points.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    try {
      return this.transactionService.create(createTransactionDto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          statusCode: 401,
          message: 'Unauthorized',
        }
      }
      return {
        statusCode: 400,
        message: `Failed to create transaction: ${error.message}`,
      };
    }
  }

  @Get('balance')
  balance() {
    try {
      return this.transactionService.balance();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          statusCode: 401,
          message: 'Unauthorized',
        }
      }
      return {
        statusCode: 400,
        message: `Failed to get balance: ${error.message}`,
      };
    }
  }

  @Post('spend')
  spend(@Body() spendPointsDto: SpendPointsDto) {
    try {
      return this.transactionService.spend(spendPointsDto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          statusCode: 401,
          message: 'Unauthorized',
        }
      }
      return {
        statusCode: 400,
        message: `Failed to spend points: ${error.message}`,
      };
    }
  }
}
