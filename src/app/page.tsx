'use client';

import { Sidebar } from '@/components/Sidebar';
import { SearchPanel } from '@/components/SearchPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { PlayerBar } from '@/components/PlayerBar';
import { DynamicMediaDock } from '@/components/DynamicMediaDock';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function Home() {
  const activeView = usePlayerStore((s) => s.activeView);

  return (
    <div className="flex h-screen flex-col bg-black text-zinc-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {activeView === 'search' ? <SearchPanel /> : <LibraryPanel />}
        </main>
      </div>

      <PlayerBar />
      <DynamicMediaDock />
    </div>
  );
}
