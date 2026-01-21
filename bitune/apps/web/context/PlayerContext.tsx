'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Track } from '@shared/types';

interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    play: (track: Track) => void;
    pause: () => void;
    toggle: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const play = (track: Track) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(true);
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };

    const pause = () => setIsPlaying(false);

    const toggle = () => {
        if (!currentTrack) return;
        setIsPlaying(!isPlaying);
    };

    return (
        <PlayerContext.Provider value={{ currentTrack, isPlaying, play, pause, toggle }}>
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
