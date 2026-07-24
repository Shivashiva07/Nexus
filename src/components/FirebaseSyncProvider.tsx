'use client';

import { useEffect, useRef } from 'react';
import {
  auth,
  db,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  User,
} from '@/lib/firebase';
import { usePlayerStore, Playlist, Track } from '@/store/usePlayerStore';

function mergePlaylists(local: Playlist[], cloud: Playlist[], deletedIds: Set<string>): Playlist[] {
  const map = new Map<string, Playlist>();
  local.forEach((p) => {
    if (!deletedIds.has(p.id)) map.set(p.id, p);
  });
  cloud.forEach((p) => {
    if (!deletedIds.has(p.id) && !map.has(p.id)) {
      map.set(p.id, p);
    }
  });
  return Array.from(map.values());
}

function mergeTracks(local: Track[], cloud: Track[]): Track[] {
  const map = new Map<string, Track>();
  local.forEach((t) => map.set(t.id, t));
  cloud.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    }
  });
  return Array.from(map.values());
}

export function FirebaseSyncProvider({ children }: { children: React.ReactNode }) {
  const setFirebaseUser = usePlayerStore((s) => s.setFirebaseUser);
  const setUserProfile = usePlayerStore((s) => s.setUserProfile);
  const setLibraryFromCloud = usePlayerStore((s) => s.setLibraryFromCloud);
  const setPlaylistsFromCloud = usePlayerStore((s) => s.setPlaylistsFromCloud);
  const setRecentSearchesFromCloud = usePlayerStore((s) => s.setRecentSearchesFromCloud);

  const library = usePlayerStore((s) => s.library);
  const playlists = usePlayerStore((s) => s.playlists);
  const recentSearches = usePlayerStore((s) => s.recentSearches);
  const firebaseUser = usePlayerStore((s) => s.firebaseUser);

  const stateRef = useRef({ library, playlists, recentSearches });
  const deletedPlaylistIdsRef = useRef<Set<string>>(new Set());
  const prevPlaylistsRef = useRef<Playlist[]>(playlists);

  // Detect locally deleted playlist IDs to prevent resurrection from cloud snapshots
  useEffect(() => {
    const currentIds = new Set(playlists.map((p) => p.id));
    prevPlaylistsRef.current.forEach((prevP) => {
      if (!currentIds.has(prevP.id)) {
        deletedPlaylistIdsRef.current.add(prevP.id);
      }
    });
    prevPlaylistsRef.current = playlists;
    stateRef.current = { library, playlists, recentSearches };
  }, [library, playlists, recentSearches]);

  // 1. Handle Firebase Auth state & Anonymous sign-in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setFirebaseUser(user.uid);
        setUserProfile({
          userEmail: user.email,
          userDisplayName: user.displayName,
          userPhotoURL: user.photoURL,
          isAnonymousUser: user.isAnonymous,
        });
      } else {
        setUserProfile(null);
        try {
          const cred = await signInAnonymously(auth);
          setFirebaseUser(cred.user.uid);
          setUserProfile({
            userEmail: cred.user.email,
            userDisplayName: cred.user.displayName,
            userPhotoURL: cred.user.photoURL,
            isAnonymousUser: cred.user.isAnonymous,
          });
        } catch (err) {
          console.warn('Firebase anonymous auth failed:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUserProfile]);

  // 2. Attach Firestore Realtime Listener & Merge Cloud Data
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, 'users', firebaseUser);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const currentState = stateRef.current;

          // Merge playlists & library to prevent local data loss or deletion reverts
          if (Array.isArray(data.playlists)) {
            const merged = mergePlaylists(
              currentState.playlists,
              data.playlists as Playlist[],
              deletedPlaylistIdsRef.current
            );
            setPlaylistsFromCloud(merged);
          }
          if (Array.isArray(data.library)) {
            const merged = mergeTracks(currentState.library, data.library as Track[]);
            setLibraryFromCloud(merged);
          }
          if (Array.isArray(data.recentSearches)) {
            const set = new Set([...currentState.recentSearches, ...data.recentSearches]);
            setRecentSearchesFromCloud(Array.from(set));
          }
        } else {
          // First time cloud user: initialize document with current local state
          const currentState = stateRef.current;
          setDoc(userDocRef, {
            library: currentState.library || [],
            playlists: currentState.playlists || [],
            recentSearches: currentState.recentSearches || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) => console.warn('Failed to seed cloud user document:', err));
        }
      },
      (err) => {
        console.warn('Firestore subscription error (using local storage):', err.message);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, setLibraryFromCloud, setPlaylistsFromCloud, setRecentSearchesFromCloud]);

  // 3. Push local changes to Firestore when store state updates
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, 'users', firebaseUser);
    const timeout = setTimeout(() => {
      setDoc(
        userDocRef,
        {
          library,
          playlists,
          recentSearches,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.warn('Failed to sync to Firestore:', err));
    }, 200);

    return () => clearTimeout(timeout);
  }, [firebaseUser, library, playlists, recentSearches]);

  return <>{children}</>;
}
