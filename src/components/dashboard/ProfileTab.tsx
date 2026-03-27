import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Sparkles, 
  Banknote, 
  Bell, 
  MessageCircle, 
  Users as UsersIcon,
  ExternalLink,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SupportChannel {
  id: string;
  channel_name: string;
  channel_url: string;
  channel_type: string;
}

interface ProfileTabProps {
  user: any;
  userBalance: any;
  completedReferrals: number;
  navigate: (path: string) => void;
}

export const ProfileTab = ({ user, userBalance, completedReferrals, navigate }: ProfileTabProps) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as Notification[];
    },
    enabled: !!user
  });

  // Fetch support channels
  const { data: supportChannels } = useQuery({
    queryKey: ['support-channels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('support_channels')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      return (data || []) as SupportChannel[];
    }
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleOpenNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      refetchNotifications();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Notification Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {new Date(selectedNotification?.created_at || '').toLocaleDateString('bn-BD')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-foreground whitespace-pre-wrap">{selectedNotification?.message}</p>
          </div>
        </DialogContent>
      </Dialog>

      <h1 className="text-xl font-bold text-foreground pt-2">প্রোফাইল</h1>

      {/* User Info Card */}
      <Card className="border-border">
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{user.user_metadata?.name || 'ইউজার'}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {userBalance?.referred_by && (
            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              রেফার কোড: {userBalance.referred_by}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications Section */}
      {notifications && notifications.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                নোটিফিকেশন
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    {unreadCount}
                  </Badge>
                )}
              </h3>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleOpenNotification(notif)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    notif.is_read 
                      ? 'bg-muted/50 hover:bg-muted' 
                      : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">মোট ব্যালেন্স</span>
            <span className="font-bold text-foreground">৳{userBalance?.balance || 0}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">মোট আয়</span>
            <span className="font-bold text-foreground">৳{userBalance?.total_earned || 0}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">সফল নম্বর</span>
            <span className="font-bold text-foreground">{userBalance?.successful_numbers || 0}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">সফল রেফারেল</span>
            <span className="font-bold text-foreground">{completedReferrals}</span>
          </div>
        </CardContent>
      </Card>

      {/* Support Channels Section */}
      {supportChannels && supportChannels.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              সাপোর্ট
            </h3>
            <div className="space-y-2">
              {supportChannels.map((channel) => (
                <a 
                  key={channel.id}
                  href={channel.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      channel.channel_type === 'channel' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {channel.channel_type === 'channel' 
                        ? <MessageCircle className="w-4 h-4" />
                        : <UsersIcon className="w-4 h-4" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{channel.channel_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.channel_type === 'channel' ? 'টেলিগ্রাম চ্যানেল' : 'টেলিগ্রাম গ্রুপ'}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button className="w-full h-12 rounded-xl gap-2 bg-primary" onClick={() => navigate('/withdraw')}>
        <Banknote className="w-5 h-5" />
        উইথড্র করুন
      </Button>

      <Button 
        variant="outline" 
        className="w-full h-12 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={handleLogout}
      >
        লগ আউট
      </Button>
    </div>
  );
};