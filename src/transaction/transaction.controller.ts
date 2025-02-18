import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { SpendPointsDto } from './dto/spend-points.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  findAll() {
    return this.transactionService.findAll();
  }
  
  @Get('points/balance')
  balance() {
    return this.transactionService.balance();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Patch('spend/:id')
  update(@Param('id') id: string, @Body() spendPointsDto: SpendPointsDto) {
    return this.transactionService.spend(spendPointsDto);
  }

}
