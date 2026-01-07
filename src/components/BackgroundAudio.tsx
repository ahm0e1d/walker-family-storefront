import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface BackgroundAudioProps {
  audioUrl: string;
}

// Singleton audio instance to prevent duplicates
let globalAudio: HTMLAudioElement | null = null;
let globalAudioUrl: string = "";

const BackgroundAudio = ({ audioUrl }: BackgroundAudioProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isInitializing = useRef(false);

  const activateAudio = () => {
    if (globalAudio && !isPlaying) {
      globalAudio.play().then(() => {
        setIsPlaying(true);
        setNeedsActivation(false);
      }).catch(console.error);
    }
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "m" || key === "م" || e.code === "KeyM") {
        if (needsActivation) {
          activateAudio();
        } else {
          setIsMuted((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [needsActivation, isPlaying]);

  // Hide hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Handle mute/unmute - just change the property, don't recreate audio
  useEffect(() => {
    if (globalAudio) {
      globalAudio.muted = isMuted;
    }
  }, [isMuted]);

  // Initialize audio only once with singleton pattern
  useEffect(() => {
    if (!audioUrl) return;
    
    // If same URL and audio exists, don't recreate
    if (globalAudio && globalAudioUrl === audioUrl) {
      // Sync state with existing audio
      setIsPlaying(!globalAudio.paused);
      setNeedsActivation(globalAudio.paused);
      return;
    }
    
    // Prevent double initialization
    if (isInitializing.current) return;
    isInitializing.current = true;
    
    // Clean up old audio if URL changed
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.src = "";
      globalAudio = null;
    }
    
    // Create new audio
    globalAudioUrl = audioUrl;
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.muted = isMuted;
    globalAudio = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setNeedsActivation(false);
          isInitializing.current = false;
        })
        .catch(() => {
          setNeedsActivation(true);
          setIsPlaying(false);
          isInitializing.current = false;
        });
    }
    
    // Cleanup only on unmount, not on re-renders
    return () => {
      // Don't cleanup on every re-render, only when component truly unmounts
      // The singleton pattern handles this
    };
  }, [audioUrl]);

  // Cleanup on actual unmount
  useEffect(() => {
    return () => {
      if (globalAudio) {
        globalAudio.pause();
        globalAudio.src = "";
        globalAudio = null;
        globalAudioUrl = "";
      }
    };
  }, []);

  if (!audioUrl) return null;

  return (
    <>
      {/* Mute Hint - Fixed at top */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-4 py-2 rounded-full shadow-lg">
              {isMuted ? (
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
        onClick={() => {
          if (needsActivation) {
            activateAudio();
          } else {
            setIsMuted((prev) => !prev);
          }
        }}
        className={`fixed bottom-4 left-4 z-40 flex items-center gap-2 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg transition-colors ${
          needsActivation 
            ? "bg-primary/90 hover:bg-primary animate-pulse" 
            : "bg-background/90 hover:bg-muted"
        }`}
      >
        {needsActivation ? (
          <>
            <Volume2 className="w-5 h-5 text-primary-foreground" />
            <span className="text-sm text-primary-foreground font-medium">اضغط لتشغيل الصوت</span>
          </>
        ) : isMuted ? (
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
