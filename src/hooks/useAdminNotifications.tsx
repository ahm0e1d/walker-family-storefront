import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewPendingUser {
  id: string;
  email: string;
  discord_username: string;
  created_at: string;
}

// Singleton for notification sound
let notificationAudio: HTMLAudioElement | null = null;

const getNotificationSound = () => {
  if (!notificationAudio) {
    // Using a simple notification sound URL
    notificationAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    notificationAudio.volume = 0.5;
  }
  return notificationAudio;
};

export const useAdminNotifications = (
  isEnabled: boolean,
  onNewPendingUser?: (user: NewPendingUser) => void
) => {
  const { toast } = useToast();
  const hasPlayedRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = getNotificationSound();
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.log("Could not play notification sound:", err);
      });
    } catch (error) {
      console.error("Error playing notification:", error);
    }
  }, []);

  const showVisualNotification = useCallback(
    (user: NewPendingUser) => {
      toast({
        title: "🔔 طلب تفعيل جديد!",
        description: `${user.discord_username} يطلب تفعيل حسابه`,
        duration: 10000,
        className: "bg-primary text-primary-foreground border-primary animate-pulse",
      });
    },
    [toast]
  );

  useEffect(() => {
    if (!isEnabled) return;

    // Reset first load flag after initial render
    const timer = setTimeout(() => {
      isFirstLoadRef.current = false;
    }, 3000);

    const channel = supabase
      .channel("pending_users_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pending_users",
        },
        (payload) => {
          const newUser = payload.new as NewPendingUser;
          
          // Skip if we've already notified for this user or if it's the first load
          if (hasPlayedRef.current.has(newUser.id) || isFirstLoadRef.current) {
            return;
          }

          hasPlayedRef.current.add(newUser.id);

          // Play sound and show visual notification
          playNotificationSound();
          showVisualNotification(newUser);

          // Callback to refresh data
          onNewPendingUser?.(newUser);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [isEnabled, playNotificationSound, showVisualNotification, onNewPendingUser]);

  return {
    playNotificationSound,
    showVisualNotification,
  };
};
