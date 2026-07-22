import type { Track } from '@/store/usePlayerStore';

export interface AggregatedSearchResult {
  spotify: Track[];
  youtube: Track[];
  soundcloud: Track[];
  vsnectar: Track[];
  errors: Partial<Record<'spotify' | 'youtube' | 'soundcloud' | 'vsnectar', string>>;
}
