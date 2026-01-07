import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Global audio manager - completely outside React lifecycle
class AudioManager {
  private static instance: AudioManager;
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string = "";
  private listeners: Set<() => void> = new Set();
  
  public isMuted: boolean = false;
  public isPlaying: boolean = false;
  public needsActivation: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  async initialize(url: string) {
    if (!url) return;
    
    // Already playing this URL
    if (this.audio && this.currentUrl === url && !this.audio.paused) {
      return;
    }

    // Same URL but paused (needs activation)
    if (this.audio && this.currentUrl === url) {
      return;
    }

    // New URL - cleanup old audio
    if (this.audio && this.currentUrl !== url) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }

    // Create new audio
    this.currentUrl = url;
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.muted = this.isMuted;

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.needsActivation = false;
    } catch {
      this.needsActivation = true;
      this.isPlaying = false;
    }
    this.notify();
  }

  async activate() {
    if (this.audio && !this.isPlaying) {
      try {
        await this.audio.play();
        this.isPlaying = true;
        this.needsActivation = false;
        this.notify();
      } catch (e) {
        console.error("Failed to activate audio:", e);
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.muted = this.isMuted;
    }
    this.notify();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.notify();
  }

  getState() {
    return {
      isMuted: this.isMuted,
      isPlaying: this.isPlaying,
      needsActivation: this.needsActivation,
    };
  }
}

// Get singleton instance
const audioManager = AudioManager.getInstance();

const BackgroundAudio = () => {
  const [state, setState] = useState(audioManager.getState());
  const [showHint, setShowHint] = useState(true);

  // Subscribe to audio manager changes
  useEffect(() => {
    const unsubscribe = audioManager.subscribe(() => {
      setState(audioManager.getState());
    });
    return () => { unsubscribe(); };
  }, []);

  // Fetch audio URL and initialize
  useEffect(() => {
    const fetchAndInitialize = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "audio_url")
        .single();
      
      if (data && typeof data.value === "string" && data.value) {
        audioManager.initialize(data.value);
      }
    };
    
    fetchAndInitialize();
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "m" || key === "م" || e.code === "KeyM") {
        if (state.needsActivation) {
          audioManager.activate();
        } else {
          audioManager.toggleMute();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [state.needsActivation]);

  // Hide hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (state.needsActivation) {
      audioManager.activate();
    } else {
      audioManager.toggleMute();
    }
  };

  return (
    <>
      {/* Mute Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-4 py-2 rounded-full shadow-lg">
              {state.isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm text-foreground hidden md:inline">
                اضغط <kbd className="px-2 py-0.5 bg-muted rounded text-primary font-mono mx-1">M</kbd> لتفعيل/إيقاف الصوت
              </span>
              <span className="text-sm text-foreground md:hidden">
                اضغط الزر لتفعيل/إيقاف الصوت
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Control Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleClick}
        className={`fixed bottom-4 left-4 z-40 flex items-center gap-2 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg transition-colors ${
          state.needsActivation 
            ? "bg-primary/90 hover:bg-primary animate-pulse" 
            : "bg-background/90 hover:bg-muted"
        }`}
      >
        {state.needsActivation ? (
          <>
            <Volume2 className="w-5 h-5 text-primary-foreground" />
            <span className="text-sm text-primary-foreground font-medium">اضغط لتشغيل الصوت</span>
          </>
        ) : state.isMuted ? (
          <>
            <VolumeX className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">الصوت مكتوم</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="text-sm text-primary">الصوت مفعّل</span>
          </>
        )}
      </motion.button>
    </>
  );
};

export default BackgroundAudio;
