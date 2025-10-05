import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpMonitorModule } from './http-monitor/http-monitor.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      expandVariables: true,
    }),

    // Connect to MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/http-monitor',
      {
        retryAttempts: 5,
        retryDelay: 3000,
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('✅ MongoDB connected'));
          connection.on('error', (error) =>
            console.error('❌ MongoDB error:', error),
          );
          connection.on('disconnected', () =>
            console.warn('⚠️ MongoDB disconnected'),
          );
          return connection;
        },
      },
    ),

    // Enable scheduled tasks
    ScheduleModule.forRoot(),

    // HTTP monitoring feature module
    HttpMonitorModule,
  ],

  // Root controllers and providers
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
