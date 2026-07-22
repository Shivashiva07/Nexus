'use client';

import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { SearchPanel } from '@/components/SearchPanel';
import { LibraryPanel } from '@/components/LibraryPanel';
import { QueuePanel } from '@/components/QueuePanel';
import { Toast } from '@/components/Toast';
import { PlayerBar } from '@/components/PlayerBar';
import { DynamicMediaDock } from '@/components/DynamicMediaDock';
import { FirebaseSyncProvider } from '@/components/FirebaseSyncProvider';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function Home() {
  const activeView = usePlayerStore((s) => s.activeView);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);

  return (
    <FirebaseSyncProvider>
      <div className="flex h-screen flex-col bg-black text-zinc-100">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {activeView === 'search' ? <SearchPanel /> : <LibraryPanel />}
          </main>
          {isQueueOpen && <QueuePanel />}
        </div>

        <PlayerBar />
        <DynamicMediaDock />
        <Toast />
      </div>
    </FirebaseSyncProvider>
  );
}
