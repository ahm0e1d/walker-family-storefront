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
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!videoUrl) return null;

  // Check if URL is embeddable (YouTube, etc.) or direct video
  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const isVimeo = videoUrl.includes("vimeo.com");
  
  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      const videoId = url.includes("youtu.be") 
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    }
    if (isVimeo) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=${isMuted ? 1 : 0}&loop=1&background=1`;
    }
    return url;
  };

  const isEmbed = isYouTube || isVimeo;

  return (
    <section className="fixed bottom-0 left-0 right-0 h-[30vh] md:h-[35vh] overflow-hidden z-10 pointer-events-none">
      {/* Video Background */}
      {isEmbed ? (
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="absolute inset-0 w-full h-full object-cover scale-150"
          allow="autoplay; fullscreen"
          style={{ border: "none" }}
        />
      ) : (
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
      )}

      {/* Overlay for better visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {/* Mute Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
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

      {/* Mute/Unmute Button - Always visible for mobile and desktop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-4 right-4 z-20 pointer-events-auto"
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
