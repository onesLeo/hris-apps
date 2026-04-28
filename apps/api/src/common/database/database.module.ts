import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DATABASE_SERVICE } from './database.types';

@Global()
@Module({
  providers: [
    DatabaseService,
    { provide: DATABASE_SERVICE, useExisting: DatabaseService },
  ],
  exports: [DatabaseService, DATABASE_SERVICE],
})
export class DatabaseModule {}
