import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['*'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1')
  await app.listen(process.env.PORT ?? 4000);

}

// hit the login endpoint
fetch('http://localhost:4000/api/v1/users/login', {
  method: 'POST',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  body: JSON.stringify({
    email: 'bilalk@gmail.com',
    password: 'password123'
  })
})

bootstrap();
