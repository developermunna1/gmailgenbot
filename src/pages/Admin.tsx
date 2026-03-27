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

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("লগআউট হয়েছে");
    navigate("/");
  };

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
        <Tabs defaultValue="gmails" className="w-full">
          <TabsList className="flex flex-wrap gap-2 mb-8 h-auto bg-card p-2 rounded-xl border border-border shadow-sm">
            <TabsTrigger value="gmails" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">জিমেইল</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">নম্বর</span>
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

          <TabsContent value="gmails">
            <GmailRequestsPanel />
          </TabsContent>

          <TabsContent value="requests">
            <NumberRequestsPanel />
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

export default Admin;