import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { HolidayController } from './holiday.controller';
import { HolidayRepository } from './holiday.repository';
import { HolidayService } from './holiday.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HolidayController],
  providers: [HolidayRepository, HolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}
