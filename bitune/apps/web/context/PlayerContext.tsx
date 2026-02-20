'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bittune_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('bittune_history', JSON.stringify(history.slice(0, 20)));
    }, [history]);

    const play = (track: Track, newQueue?: Track[]) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(true);
        } else {
            if (currentTrack) {
                // Add current track to history, ensuring no duplicates at the top
                setHistory(prev => {
                    const newHistory = [currentTrack, ...prev.filter(t => t.id !== currentTrack.id)];
                    return newHistory.slice(0, 20);
                });
            }
            setCurrentTrack(track);
            setIsPlaying(true);
            if (newQueue) {
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
                setHistory(prev => {
                    const newHistory = [currentTrack, ...prev.filter(t => t.id !== currentTrack.id)];
                    return newHistory.slice(0, 20);
                });
            }
            setCurrentTrack(nextTrack);
            setIsPlaying(true);
        } else {
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

