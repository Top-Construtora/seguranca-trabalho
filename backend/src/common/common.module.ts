import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './services/supabase.service';
import { LocalStorageService } from './services/local-storage.service';

@Global()
@Module({
  providers: [SupabaseService, LocalStorageService],
  exports: [SupabaseService, LocalStorageService],
})
export class CommonModule {}