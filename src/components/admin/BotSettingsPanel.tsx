import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Bot, Copy, ExternalLink } from "lucide-react";

interface BotSettings {
  id: string;
  bot_token: string | null;
  bot_username: string | null;
  is_active: boolean;
}

export const BotSettingsPanel = () => {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bot_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
    } else if (data) {
      setSettings(data);
      setBotToken(data.bot_token || "");
      setBotUsername(data.bot_username || "");
      setIsActive(data.is_active);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      if (settings) {
        const { error } = await supabase
          .from("bot_settings")
          .update({
            bot_token: botToken,
            bot_username: botUsername,
            is_active: isActive,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("bot_settings").insert({
          bot_token: botToken,
          bot_username: botUsername,
          is_active: isActive,
        });

        if (error) throw error;
      }

      toast.success("সেটিংস সেভ হয়েছে");
      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const setupWebhook = async () => {
    if (!botToken) {
      toast.error("প্রথমে বট টোকেন দিন");
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();

      if (data.ok) {
        toast.success("Webhook সফলভাবে সেটআপ হয়েছে");
      } else {
        toast.error(`Webhook সেটআপ ব্যর্থ: ${data.description}`);
      }
    } catch (error) {
      console.error("Webhook setup error:", error);
      toast.error("Webhook সেটআপ করতে সমস্যা হয়েছে");
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL কপি হয়েছে");
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
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Bot className="w-5 h-5" />
            টেলিগ্রাম বট সেটিংস
          </CardTitle>
          <CardDescription>
            আপনার টেলিগ্রাম বটের তথ্য এবং সেটিংস কনফিগার করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bot-token">বট টোকেন</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              @BotFather থেকে পাওয়া টোকেন
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-username">বট ইউজারনেম</Label>
            <Input
              id="bot-username"
              placeholder="@YourBotUsername"
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-active">বট সক্রিয়</Label>
              <p className="text-sm text-muted-foreground">
                বট চালু বা বন্ধ করুন
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "সেভ হচ্ছে..." : "সেটিংস সেভ করুন"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Webhook সেটআপ</CardTitle>
          <CardDescription>
            টেলিগ্রাম বটের Webhook কনফিগার করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" onClick={copyWebhookUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={setupWebhook} variant="outline" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Webhook সেটআপ করুন
          </Button>

          <p className="text-sm text-muted-foreground">
            বট টোকেন সেভ করার পর এই বাটনে ক্লিক করে Webhook সেটআপ করুন। 
            এটি টেলিগ্রাম থেকে মেসেজ গ্রহণ করতে সক্ষম করবে।
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
