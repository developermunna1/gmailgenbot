import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { RefreshCw, Plus, Edit, Trash2, MessageCircle, Users, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupportChannel {
  id: string;
  channel_name: string;
  channel_url: string;
  channel_type: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const SupportChannelsPanel = () => {
  const [channels, setChannels] = useState<SupportChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SupportChannel | null>(null);
  
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelType, setChannelType] = useState<"channel" | "group">("channel");
  const [saving, setSaving] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_channels")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      toast.error("চ্যানেল লোড করতে সমস্যা হয়েছে");
    } else {
      setChannels(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleAddChannel = async () => {
    if (!channelName || !channelUrl) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from("support_channels").insert({
        channel_name: channelName,
        channel_url: channelUrl,
        channel_type: channelType,
        display_order: channels.length
      });
      
      if (error) throw error;
      
      toast.success("চ্যানেল যোগ হয়েছে");
      setIsAddingChannel(false);
      setChannelName("");
      setChannelUrl("");
      fetchChannels();
    } catch (error: any) {
      toast.error(error.message || "চ্যানেল যোগ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleEditChannel = (channel: SupportChannel) => {
    setEditingChannel(channel);
    setChannelName(channel.channel_name);
    setChannelUrl(channel.channel_url);
    setChannelType(channel.channel_type as "channel" | "group");
    setIsEditingChannel(true);
  };

  const handleUpdateChannel = async () => {
    if (!editingChannel || !channelName || !channelUrl) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("support_channels")
        .update({
          channel_name: channelName,
          channel_url: channelUrl,
          channel_type: channelType
        })
        .eq("id", editingChannel.id);
      
      if (error) throw error;
      
      toast.success("চ্যানেল আপডেট হয়েছে");
      setIsEditingChannel(false);
      setEditingChannel(null);
      setChannelName("");
      setChannelUrl("");
      fetchChannels();
    } catch (error: any) {
      toast.error(error.message || "চ্যানেল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (channel: SupportChannel) => {
    try {
      const { error } = await supabase
        .from("support_channels")
        .update({ is_active: !channel.is_active })
        .eq("id", channel.id);
      
      if (error) throw error;
      fetchChannels();
    } catch (error) {
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("এই চ্যানেলটি মুছে ফেলতে চান?")) return;
    
    try {
      const { error } = await supabase
        .from("support_channels")
        .delete()
        .eq("id", channelId);
      
      if (error) throw error;
      toast.success("চ্যানেল মুছে ফেলা হয়েছে");
      fetchChannels();
    } catch (error) {
      toast.error("চ্যানেল মুছতে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Channel Dialog */}
      <Dialog open={isAddingChannel || isEditingChannel} onOpenChange={(open) => {
        if (!open) {
          setIsAddingChannel(false);
          setIsEditingChannel(false);
          setEditingChannel(null);
          setChannelName("");
          setChannelUrl("");
        }
      }}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditingChannel ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {isEditingChannel ? "চ্যানেল এডিট করুন" : "নতুন চ্যানেল যোগ করুন"}
            </DialogTitle>
            <DialogDescription>সাপোর্ট টেলিগ্রাম চ্যানেল/গ্রুপ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>টাইপ</Label>
              <Select value={channelType} onValueChange={(v: "channel" | "group") => setChannelType(v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="channel">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      চ্যানেল
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      গ্রুপ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>চ্যানেল/গ্রুপ নাম</Label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="যেমন: Official Support"
              />
            </div>
            <div className="space-y-2">
              <Label>লিংক</Label>
              <Input
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="https://t.me/..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsAddingChannel(false);
                  setIsEditingChannel(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                বাতিল
              </Button>
              <Button 
                className="flex-1"
                onClick={isEditingChannel ? handleUpdateChannel : handleAddChannel}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditingChannel ? "আপডেট" : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">সাপোর্ট চ্যানেল/গ্রুপ</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            <RefreshCw className="w-4 h-4 mr-2" />
            রিফ্রেশ
          </Button>
          <Button size="sm" onClick={() => setIsAddingChannel(true)}>
            <Plus className="w-4 h-4 mr-2" />
            নতুন যোগ করুন
          </Button>
        </div>
      </div>

      {/* Channel List */}
      {channels.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">কোন সাপোর্ট চ্যানেল নেই</p>
            <Button className="mt-4" onClick={() => setIsAddingChannel(true)}>
              <Plus className="w-4 h-4 mr-2" />
              চ্যানেল যোগ করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <Card key={channel.id} className="border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      channel.channel_type === 'channel' 
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-purple-500/10 text-purple-600'
                    }`}>
                      {channel.channel_type === 'channel' 
                        ? <MessageCircle className="w-5 h-5" />
                        : <Users className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">{channel.channel_name}</h4>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{channel.channel_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={channel.channel_type === 'channel' ? 'default' : 'secondary'}>
                      {channel.channel_type === 'channel' ? 'চ্যানেল' : 'গ্রুপ'}
                    </Badge>
                    <Switch 
                      checked={channel.is_active}
                      onCheckedChange={() => handleToggleActive(channel)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEditChannel(channel)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChannel(channel.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};