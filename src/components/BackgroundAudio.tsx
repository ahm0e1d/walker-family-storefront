import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface BackgroundAudioProps {
  audioUrl: string;
}

const BackgroundAudio = ({ audioUrl }: BackgroundAudioProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Support both English 'M' and Arabic 'م' for keyboard toggle
      const key = e.key.toLowerCase();
      if (key === "m" || key === "م" || e.code === "KeyM") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    // Hide hint after 10 seconds
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Try to play audio when component mounts
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
        console.log("Autoplay blocked, waiting for user interaction");
      });
    }
  }, [audioUrl]);

  if (!audioUrl) return null;

  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        autoPlay
        loop
        muted={isMuted}
        style={{ display: "none" }}
      />

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

      {/* Floating Audio Control Button - Fixed at bottom right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsMuted((prev) => !prev)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg hover:bg-muted transition-colors"
      >
        {isMuted ? (
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
