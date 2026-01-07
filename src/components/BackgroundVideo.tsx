import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Video, X } from "lucide-react";

interface BackgroundVideoProps {
  videoUrl: string;
}

const BackgroundVideo = ({ videoUrl }: BackgroundVideoProps) => {
  const [isMuted, setIsMuted] = useState(false); // Start with sound ON
  const [isHidden, setIsHidden] = useState(false);
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

      {/* Show Video Button - When video is hidden */}
      <AnimatePresence>
        {isHidden && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsHidden(false)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg hover:bg-muted transition-colors"
          >
            <Video className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">عرض الفيديو</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Small Video Box - Fixed at bottom right */}
      <AnimatePresence>
        {!isHidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-4 right-4 z-40 w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-2xl border border-border"
          >
            {/* Hide Button */}
            <button
              onClick={() => setIsHidden(true)}
              className="absolute top-1 right-1 z-10 p-1 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Video */}
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

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />

            {/* Mute/Unmute Button inside video box */}
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackgroundVideo;
