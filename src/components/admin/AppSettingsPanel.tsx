import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Settings, Gift, Users, Wallet, Phone, RefreshCw } from "lucide-react";

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_label: string | null;
}

export const AppSettingsPanel = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("created_at");

    if (error) {
      console.error("Error fetching settings:", error);
      toast.error("সেটিংস লোড করতে সমস্যা হয়েছে");
    } else {
      setSettings(data || []);
      const values: Record<string, string> = {};
      data?.forEach((s) => {
        values[s.setting_key] = s.setting_value;
      });
      setEditedValues(values);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        if (editedValues[setting.setting_key] !== setting.setting_value) {
          const { error } = await supabase
            .from("app_settings")
            .update({ 
              setting_value: editedValues[setting.setting_key],
              updated_at: new Date().toISOString()
            })
            .eq("setting_key", setting.setting_key);
          
          if (error) throw error;
        }
      }
      toast.success("সেটিংস সফলভাবে সেভ হয়েছে");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const getIconForSetting = (key: string) => {
    switch (key) {
      case 'welcome_bonus':
        return <Gift className="w-5 h-5 text-amber-500" />;
      case 'referral_bonus':
        return <Users className="w-5 h-5 text-primary" />;
      case 'per_number_earning':
        return <Phone className="w-5 h-5 text-blue-500" />;
      case 'min_withdrawal':
        return <Wallet className="w-5 h-5 text-purple-500" />;
      case 'withdrawal_fee':
        return <Wallet className="w-5 h-5 text-destructive" />;
      default:
        return <Settings className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getUnitForSetting = (key: string) => {
    if (key === 'withdrawal_fee') return '%';
    return '৳';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">অ্যাপ সেটিংস</h2>
          <p className="text-muted-foreground">ওয়েবসাইটের সব সেটিংস এখান থেকে কন্ট্রোল করুন</p>
        </div>
        <Button variant="outline" onClick={fetchSettings} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => (
          <Card key={setting.id} className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getIconForSetting(setting.setting_key)}
                {setting.setting_label || setting.setting_key}
              </CardTitle>
              <CardDescription className="text-xs">
                Key: {setting.setting_key}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editedValues[setting.setting_key] || ""}
                  onChange={(e) =>
                    setEditedValues((prev) => ({
                      ...prev,
                      [setting.setting_key]: e.target.value,
                    }))
                  }
                  className="text-lg font-bold"
                />
                <span className="text-muted-foreground">{getUnitForSetting(setting.setting_key)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">পরিবর্তন সেভ করুন</h3>
              <p className="text-sm text-muted-foreground">সব পরিবর্তন একসাথে সেভ হবে</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              সেভ করুন
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};