import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private users: User[] = [];
  private defaultUser: User;

  constructor() {
    // Create a new user on service startup
    this.defaultUser = new User({
      _id: '500',
      name: 'Bilal K',
      email: 'bilalk@gmail.com',
      totalPoints: 10000,
      password: 'password123',
    });
    this.users.push(this.defaultUser);
  }

  create(createUserDto: CreateUserDto) {
    const user = new User({
      _id: uuidv4(),
      ...createUserDto
    });
    this.users.push(user);
    return user;
  }

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find(user => user._id === id);
  }

  findByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const index = this.users.findIndex(user => user._id === id);
    if (index !== -1) {
      // Remove protected fields from the update DTO
      const { _id, email, ...allowedUpdates } = updateUserDto as any;
      this.users[index] = { ...this.users[index], ...allowedUpdates };
      return this.users[index];
    }
    return null;
  }

  remove(id: string) {
    // check if user is deleting themselves
    const loggedInUser = this.getLoggedInUser();
    if (loggedInUser && loggedInUser._id == id) {
      throw new ForbiddenException('You are not allowed to delete your own account');
    }
    const index = this.users.findIndex(user => user._id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  login(email: string, password: string) {
    const user = this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password === password) {
      user.isLoggedIn = true;
      user.token = uuidv4();
      
      // Logging out other users asynchronously
      setImmediate(() => {
        this.users
          .filter(u => u._id !== user._id && u.isLoggedIn)
          .forEach(u => {
            u.isLoggedIn = false;
            u.token = null;
          });
      });

      return user;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  signup(createUserDto: CreateUserDto) {
    const user = new User({
      _id: uuidv4(),
      ...createUserDto,
      isLoggedIn: true,
      token: uuidv4(),
    });
    this.users.push(user);
    return user;
  }

  validateToken(token: string): User | null {
    const user = this.users.find(user => user.token === token && user.isLoggedIn);
    return user || null;
  }

  getLoggedInUser(): User | null {
    const loggedInUser = this.users.find(user => user.isLoggedIn);
    return loggedInUser || null;
  }
}