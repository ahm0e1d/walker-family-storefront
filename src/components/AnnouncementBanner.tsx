import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
}

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, type")
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()");

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));
  const currentAnnouncement = visibleAnnouncements[currentIndex];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return { bg: "bg-green-500/10 border-green-500/30", text: "text-green-600", icon: CheckCircle };
      case "warning":
        return { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-600", icon: AlertTriangle };
      case "error":
        return { bg: "bg-red-500/10 border-red-500/30", text: "text-red-600", icon: AlertCircle };
      default:
        return { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-600", icon: Info };
    }
  };

  if (visibleAnnouncements.length === 0 || !currentAnnouncement) return null;

  const styles = getTypeStyles(currentAnnouncement.type);
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`border-b ${styles.bg} backdrop-blur-sm`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Icon className={`w-5 h-5 ${styles.text} shrink-0`} />
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAnnouncement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <span className={`font-medium ${styles.text}`}>{currentAnnouncement.title}:</span>
                    <span className="text-foreground/80 truncate">{currentAnnouncement.content}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {visibleAnnouncements.length > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentIndex((prev) => 
                      prev === 0 ? visibleAnnouncements.length - 1 : prev - 1
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentIndex + 1}/{visibleAnnouncements.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentIndex((prev) => 
                      prev === visibleAnnouncements.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDismiss(currentAnnouncement.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
