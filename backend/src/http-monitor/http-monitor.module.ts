import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpMonitorService } from './http-monitor.service';
import { HttpMonitorController } from './http-monitor.controller';
import { EventsGateway } from './events.gateway';
import {
  HttpResponse,
  HttpResponseSchema,
} from './schemas/http-response.schema';

@Module({
  imports: [
    // Register MongoDB schema for HttpResponse
    MongooseModule.forFeature([
      { name: HttpResponse.name, schema: HttpResponseSchema },
    ]),
  ],
  controllers: [HttpMonitorController],
  providers: [HttpMonitorService, EventsGateway],
  exports: [HttpMonitorService],
})
export class HttpMonitorModule {}
