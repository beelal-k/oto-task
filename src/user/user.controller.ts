import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// this represents the route: api/v1/users
@Controller('users') // the string 'users' is the route name
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    try {
      this.userService.create(createUserDto);
      return {
        message: 'User created successfully',
        statusCode: 201,
      }
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }

  @Get()
  findAll() {
    try {
      return this.userService.findAll();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          statusCode: 401,
          message: 'Unauthorized',
        }
      }
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }

  @Post('signup')
  signup(@Body() signupDto: CreateUserDto) {
    try {
      this.userService.signup(signupDto);
      return {
        message: 'Signup successful',
        statusCode: 201,
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          statusCode: 400,
          message: error.message,
        }
      }
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }

  @Post('login')
  login(@Body() loginDto: { email: string; password: string }) {
    try {
      const result = this.userService.login(loginDto.email, loginDto.password);
      return {
        message: 'Login successful',
        statusCode: 200,
        data: result,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        }
      }
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      this.userService.update(id, updateUserDto);
      return {
        message: 'User updated successfully',
        statusCode: 200,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        return {
          statusCode: 404,
          message: error.message,
        }
      }
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      this.userService.remove(id);
      return {
        message: 'User deleted successfully',
        statusCode: 200,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        return {
          statusCode: 404,
          message: error.message,
        }
      }
      return {
        statusCode: 500,
        message: 'Internal server error',
      }
    }
  }
}
