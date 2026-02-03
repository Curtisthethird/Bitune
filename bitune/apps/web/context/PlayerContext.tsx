'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Track } from '@/lib/shared/types';

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    history: Track[];
    play: (track: Track, newQueue?: Track[]) => void;
    addToQueue: (track: Track) => void;
    removeFromQueue: (trackId: string) => void;
    next: () => void;
    previous: () => void;
    pause: () => void;
    toggle: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState<Track[]>([]);
    const [history, setHistory] = useState<Track[]>([]);

    const play = (track: Track, newQueue?: Track[]) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(true);
        } else {
            if (currentTrack) {
                setHistory(prev => [currentTrack, ...prev]);
            }
            setCurrentTrack(track);
            setIsPlaying(true);
            if (newQueue) {
                // If a new queue is provided (e.g. clicking a song in an album), 
                // set queue to the tracks AFTER this one in the list.
                const trackIndex = newQueue.findIndex(t => t.id === track.id);
                if (trackIndex !== -1) {
                    setQueue(newQueue.slice(trackIndex + 1));
                }
            }
        }
    };

    const addToQueue = (track: Track) => {
        setQueue(prev => [...prev, track]);
    };

    const removeFromQueue = (trackId: string) => {
        setQueue(prev => prev.filter(t => t.id !== trackId));
    };

    const next = () => {
        if (queue.length > 0) {
            const nextTrack = queue[0];
            setQueue(prev => prev.slice(1));
            if (currentTrack) {
                setHistory(prev => [currentTrack, ...prev]);
            }
            setCurrentTrack(nextTrack);
            setIsPlaying(true);
        } else {
            // End of queue
            setIsPlaying(false);
        }
    };

    const previous = () => {
        if (history.length > 0) {
            const prevTrack = history[0];
            setHistory(prev => prev.slice(1));
            if (currentTrack) {
                setQueue(prev => [currentTrack, ...prev]);
            }
            setCurrentTrack(prevTrack);
            setIsPlaying(true);
        }
    };

    const pause = () => setIsPlaying(false);

    const toggle = () => {
        if (!currentTrack) return;
        setIsPlaying(!isPlaying);
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack, isPlaying, queue, history,
            play, addToQueue, removeFromQueue, next, previous, pause, toggle
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}

