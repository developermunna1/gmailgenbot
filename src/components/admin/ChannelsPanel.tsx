import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, ExternalLink } from "lucide-react";

interface Channel {
  id: string;
  channel_name: string;
  channel_url: string;
  channel_username: string | null;
  is_active: boolean;
  display_order: number;
}

export const ChannelsPanel = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({
    channel_name: "",
    channel_url: "",
    channel_username: "",
  });
  const [adding, setAdding] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("telegram_channels")
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

  const addChannel = async () => {
    if (!newChannel.channel_name || !newChannel.channel_url) {
      toast.error("চ্যানেলের নাম এবং URL দিন");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("telegram_channels").insert({
      channel_name: newChannel.channel_name,
      channel_url: newChannel.channel_url,
      channel_username: newChannel.channel_username || null,
      display_order: channels.length,
    });

    if (error) {
      console.error("Error adding channel:", error);
      toast.error("চ্যানেল যোগ করতে সমস্যা হয়েছে");
    } else {
      toast.success("চ্যানেল যোগ হয়েছে");
      setNewChannel({ channel_name: "", channel_url: "", channel_username: "" });
      fetchChannels();
    }
    setAdding(false);
  };

  const toggleChannel = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("telegram_channels")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    } else {
      toast.success(isActive ? "চ্যানেল সক্রিয় হয়েছে" : "চ্যানেল নিষ্ক্রিয় হয়েছে");
      fetchChannels();
    }
  };

  const deleteChannel = async (id: string) => {
    const { error } = await supabase
      .from("telegram_channels")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("মুছতে সমস্যা হয়েছে");
    } else {
      toast.success("চ্যানেল মুছে ফেলা হয়েছে");
      fetchChannels();
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
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">নতুন চ্যানেল যোগ করুন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>চ্যানেলের নাম</Label>
              <Input
                placeholder="চ্যানেলের নাম"
                value={newChannel.channel_name}
                onChange={(e) =>
                  setNewChannel({ ...newChannel, channel_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>চ্যানেল URL</Label>
              <Input
                placeholder="https://t.me/channel"
                value={newChannel.channel_url}
                onChange={(e) =>
                  setNewChannel({ ...newChannel, channel_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>ইউজারনেম (ঐচ্ছিক)</Label>
              <Input
                placeholder="@channel"
                value={newChannel.channel_username}
                onChange={(e) =>
                  setNewChannel({ ...newChannel, channel_username: e.target.value })
                }
              />
            </div>
          </div>
          <Button onClick={addChannel} disabled={adding}>
            <Plus className="w-4 h-4 mr-2" />
            {adding ? "যোগ হচ্ছে..." : "চ্যানেল যোগ করুন"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">চ্যানেল তালিকা</h3>
        {channels.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">কোন চ্যানেল নেই</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {channels.map((channel) => (
              <Card key={channel.id} className="border-border">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium text-card-foreground">
                          📢 {channel.channel_name}
                        </h4>
                        <a
                          href={channel.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {channel.channel_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${channel.id}`} className="text-sm">
                          সক্রিয়
                        </Label>
                        <Switch
                          id={`active-${channel.id}`}
                          checked={channel.is_active}
                          onCheckedChange={(checked) =>
                            toggleChannel(channel.id, checked)
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteChannel(channel.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
