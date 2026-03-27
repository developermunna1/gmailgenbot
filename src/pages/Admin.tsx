import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Phone, Tv, Users, Share2, Wallet, Sliders, MessageCircle, ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { NumberRequestsPanel } from "@/components/admin/NumberRequestsPanel";
import { ChannelsPanel } from "@/components/admin/ChannelsPanel";
import { UserBalancesPanel } from "@/components/admin/UserBalancesPanel";
import { ReferralsPanel } from "@/components/admin/ReferralsPanel";
import { WithdrawalsPanel } from "@/components/admin/WithdrawalsPanel";
import { AppSettingsPanel } from "@/components/admin/AppSettingsPanel";
import { SupportChannelsPanel } from "@/components/admin/SupportChannelsPanel";
import { GmailRequestsPanel } from "@/components/admin/GmailRequestsPanel";
import { User } from "@supabase/supabase-js";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking admin status:", error);
    }

    setIsAdmin(!!data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("সফলভাবে লগআউট হয়েছে");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">অ্যাক্সেস নিষিদ্ধ</h1>
          <p className="text-muted-foreground mb-4">আপনি অ্যাডমিন হিসেবে নিবন্ধিত নন।</p>
          <Button onClick={handleLogout}>লগআউট</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-primary-foreground">𝗧𝗮𝗽 𝗟𝗶𝗻𝗸</span>
              <span className="text-xs text-primary-foreground/70 block">Admin Panel</span>
            </div>
          </div>
          <Button variant="secondary" onClick={handleLogout} size="sm" className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-0">
            <LogOut className="w-4 h-4 mr-2" />
            লগআউট
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="flex flex-wrap gap-2 mb-8 h-auto bg-card p-2 rounded-xl border border-border shadow-sm">
            <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">নম্বর</span>
            </TabsTrigger>
            <TabsTrigger value="gmails" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">জিমেইল</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">উইথড্র</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">ইউজার</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">রেফারাল</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">চ্যানেল</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">সাপোর্ট</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">সেটিংস</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <NumberRequestsPanel />
          </TabsContent>

          <TabsContent value="gmails">
            <GmailRequestsPanel />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalsPanel />
          </TabsContent>

          <TabsContent value="balances">
            <UserBalancesPanel />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsPanel />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelsPanel />
          </TabsContent>

          <TabsContent value="support">
            <SupportChannelsPanel />
          </TabsContent>

          <TabsContent value="settings">
            <AppSettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("সফলভাবে লগইন হয়েছে");
    } catch (error: any) {
      toast.error("ভুল ইমেইল বা পাসওয়ার্ড!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground">
              অ্যাডমিন লগইন
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "লগইন"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;