import { promises as fs } from 'fs';
import path from 'path';
import type { Track } from '@/store/usePlayerStore';

export async function searchVSNectar(query: string, limit = 50): Promise<Track[]> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  try {
    // Read the pre-generated dataset from public/data
    const dataPath = path.join(process.cwd(), 'public', 'data', 'vsnectar.json');
    const fileContent = await fs.readFile(dataPath, 'utf8');
    const tracks: Track[] = JSON.parse(fileContent);

    // Filter by matching query against title or artist
    const results = tracks.filter((track) => {
      return (
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.toLowerCase().includes(normalizedQuery)
      );
    });

    return results.slice(0, limit);
  } catch {
    return [];
  }
}
