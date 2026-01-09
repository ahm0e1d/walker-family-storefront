import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Video, X, Minimize2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MediaType = "audio" | "video" | null;

// Helper to detect media type from URL
const detectMediaType = (url: string): MediaType => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  // Check for video extensions
  if (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".mov") ||
    lowerUrl.includes(".avi") ||
    lowerUrl.includes(".mkv") ||
    lowerUrl.includes("video")
  ) {
    return "video";
  }
  
  // Check for audio extensions
  if (
    lowerUrl.includes(".mp3") ||
    lowerUrl.includes(".wav") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes(".m4a") ||
    lowerUrl.includes(".aac") ||
    lowerUrl.includes("audio")
  ) {
    return "audio";
  }
  
  // Default to audio for unknown
  return "audio";
};

// Global media manager - completely outside React lifecycle
class MediaManager {
  private static instance: MediaManager;
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string = "";
  private listeners: Set<() => void> = new Set();
  
  public isMuted: boolean = false;
  public isPlaying: boolean = false;
  public needsActivation: boolean = false;
  public mediaType: MediaType = null;
  public mediaUrl: string = "";

  private constructor() {}

  static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager();
    }
    return MediaManager.instance;
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
    
    const type = detectMediaType(url);
    this.mediaType = type;
    this.mediaUrl = url;

    // For video, we don't use AudioManager - the video element handles it
    if (type === "video") {
      // Clean up any existing audio
      if (this.audio) {
        this.audio.pause();
        this.audio.src = "";
        this.audio = null;
      }
      this.currentUrl = url;
      this.needsActivation = true;
      this.isPlaying = false;
      this.notify();
      return;
    }
    
    // Audio handling
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
    if (this.mediaType === "video") {
      // Video activation is handled by the video element itself
      this.needsActivation = false;
      this.isPlaying = true;
      this.notify();
      return;
    }

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

  setPlaying(playing: boolean) {
    this.isPlaying = playing;
    this.notify();
  }

  setNeedsActivation(needs: boolean) {
    this.needsActivation = needs;
    this.notify();
  }

  getState() {
    return {
      isMuted: this.isMuted,
      isPlaying: this.isPlaying,
      needsActivation: this.needsActivation,
      mediaType: this.mediaType,
      mediaUrl: this.mediaUrl,
    };
  }
}

// Get singleton instance
const mediaManager = MediaManager.getInstance();

const BackgroundMedia = () => {
  const [state, setState] = useState(mediaManager.getState());
  const [showHint, setShowHint] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Subscribe to media manager changes
  useEffect(() => {
    const unsubscribe = mediaManager.subscribe(() => {
      setState(mediaManager.getState());
    });
    return () => { unsubscribe(); };
  }, []);

  // Fetch media URL and initialize
  useEffect(() => {
    const fetchAndInitialize = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "audio_url")
        .single();
      
      if (data && typeof data.value === "string" && data.value) {
        mediaManager.initialize(data.value);
      }
    };
    
    fetchAndInitialize();
  }, []);

  // Handle video play
  const handleVideoPlay = useCallback(async () => {
    if (videoRef.current) {
      try {
        videoRef.current.muted = state.isMuted;
        await videoRef.current.play();
        mediaManager.setPlaying(true);
        mediaManager.setNeedsActivation(false);
      } catch (e) {
        console.error("Failed to play video:", e);
        mediaManager.setNeedsActivation(true);
      }
    }
  }, [state.isMuted]);

  // Auto-play video when ready
  useEffect(() => {
    if (state.mediaType === "video" && videoRef.current && !state.needsActivation) {
      handleVideoPlay();
    }
  }, [state.mediaType, state.needsActivation, handleVideoPlay]);

  // Handle video mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = state.isMuted;
    }
  }, [state.isMuted]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "m" || key === "م" || e.code === "KeyM") {
        if (state.needsActivation && state.mediaType === "video") {
          handleVideoPlay();
        } else if (state.needsActivation) {
          mediaManager.activate();
        } else {
          mediaManager.toggleMute();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [state.needsActivation, state.mediaType, handleVideoPlay]);

  // Hide hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (state.needsActivation) {
      if (state.mediaType === "video") {
        handleVideoPlay();
      } else {
        mediaManager.activate();
      }
    } else {
      mediaManager.toggleMute();
    }
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
    mediaManager.setMuted(true);
  };

  return (
    <>
      {/* Video Player Box */}
      <AnimatePresence>
        {state.mediaType === "video" && showVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMinimized ? 120 : 280,
              height: isMinimized ? 68 : 158,
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-20 left-4 z-40 rounded-xl overflow-hidden shadow-2xl border border-border bg-background"
          >
            {/* Video Controls Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3 h-3 text-white" />
                  ) : (
                    <Minimize2 className="w-3 h-3 text-white" />
                  )}
                </button>
                <button
                  onClick={handleCloseVideo}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
              <Video className="w-3 h-3 text-white/70" />
            </div>

            {/* Video Element */}
            <video
              ref={videoRef}
              src={state.mediaUrl}
              loop
              playsInline
              muted={state.isMuted}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleClick}
            />

            {/* Play overlay when needs activation */}
            {state.needsActivation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
                onClick={handleVideoPlay}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="bg-primary/90 rounded-full p-3"
                >
                  <Volume2 className="w-6 h-6 text-primary-foreground" />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Show video button if hidden */}
      {state.mediaType === "video" && !showVideo && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            setShowVideo(true);
            mediaManager.setMuted(false);
          }}
          className="fixed bottom-4 left-48 z-40 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-3 py-2 rounded-xl shadow-lg hover:bg-muted transition-colors"
        >
          <Video className="w-5 h-5 text-primary" />
          <span className="text-sm text-primary">عرض الفيديو</span>
        </motion.button>
      )}
    </>
  );
};

export default BackgroundMedia;
