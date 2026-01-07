import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface BackgroundVideoProps {
  videoUrl: string;
}

const BackgroundVideo = ({ videoUrl }: BackgroundVideoProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") {
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
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!videoUrl) return null;

  return (
    <section className="relative min-h-[50vh] overflow-hidden snap-start">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

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
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm text-foreground">
                اضغط <kbd className="px-2 py-0.5 bg-muted rounded text-primary font-mono mx-1">M</kbd> لتفعيل/إيقاف الصوت
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Mute Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-4 right-4 z-10"
      >
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">صوت مكتوم</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary">صوت مفعل</span>
            </>
          )}
        </button>
      </motion.div>
    </section>
  );
};

export default BackgroundVideo;
