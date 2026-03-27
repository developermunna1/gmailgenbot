import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RefreshCw, Users, Wallet, TrendingUp, Edit, Bell, Phone, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserBalance {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  balance: number;
  total_earned: number;
  referral_code: string | null;
  referred_by: string | null;
  successful_numbers: number;
  created_at: string;
}

interface NumberCount {
  telegram_user_id: string;
  count: number;
}

export const UserBalancesPanel = () => {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [numberCounts, setNumberCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalEarned: 0,
  });
  
  // Edit balance state
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editingUser, setEditingUser] = useState<UserBalance | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);
  
  // Notification state
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationUser, setNotificationUser] = useState<UserBalance | null>(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);

  const fetchBalances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_balances")
      .select("*")
      .order("balance", { ascending: false });

    if (error) {
      console.error("Error fetching balances:", error);
      toast.error("ব্যালেন্স লোড করতে সমস্যা হয়েছে");
    } else {
      setBalances(data || []);
      
      // Calculate stats
      const users = data || [];
      setStats({
        totalUsers: users.length,
        totalBalance: users.reduce((sum, u) => sum + Number(u.balance), 0),
        totalEarned: users.reduce((sum, u) => sum + Number(u.total_earned), 0),
      });
    }
    setLoading(false);
  };

  const fetchNumberCounts = async () => {
    const { data, error } = await supabase
      .from("number_requests")
      .select("telegram_user_id");
    
    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((req: any) => {
        counts[req.telegram_user_id] = (counts[req.telegram_user_id] || 0) + 1;
      });
      setNumberCounts(counts);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchNumberCounts();
  }, []);

  const processPendingCredits = async () => {
    try {
      const { error } = await supabase.rpc("credit_24hour_active_numbers");
      if (error) throw error;
      toast.success("ক্রেডিট প্রসেস সম্পন্ন");
      fetchBalances();
    } catch (error) {
      console.error("Error processing credits:", error);
      toast.error("ক্রেডিট প্রসেস করতে সমস্যা হয়েছে");
    }
  };

  const handleEditBalance = (user: UserBalance) => {
    setEditingUser(user);
    setNewBalance(user.balance.toString());
    setIsEditingBalance(true);
  };

  const handleSaveBalance = async () => {
    if (!editingUser) return;
    
    setSavingBalance(true);
    try {
      const balanceValue = parseFloat(newBalance);
      if (isNaN(balanceValue) || balanceValue < 0) {
        throw new Error("সঠিক অ্যামাউন্ট দিন");
      }
      
      // Calculate the difference to update total_earned
      const oldBalance = Number(editingUser.balance);
      const difference = balanceValue - oldBalance;
      
      // If balance is increasing, also increase total_earned
      const updateData: any = { balance: balanceValue };
      if (difference > 0) {
        updateData.total_earned = Number(editingUser.total_earned) + difference;
      }
      
      const { error } = await supabase
        .from("user_balances")
        .update(updateData)
        .eq("id", editingUser.id);
      
      if (error) throw error;
      
      toast.success("ব্যালেন্স আপডেট হয়েছে");
      setIsEditingBalance(false);
      setEditingUser(null);
      fetchBalances();
    } catch (error: any) {
      toast.error(error.message || "ব্যালেন্স আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSavingBalance(false);
    }
  };

  const handleOpenNotification = (user: UserBalance) => {
    setNotificationUser(user);
    setNotificationTitle("");
    setNotificationMessage("");
    setIsSendingNotification(true);
  };

  const handleSendNotification = async () => {
    if (!notificationUser || !notificationTitle || !notificationMessage) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }
    
    setSendingNotification(true);
    try {
      // Save in-app notification
      const { error } = await supabase
        .from("user_notifications")
        .insert({
          user_id: notificationUser.telegram_user_id,
          title: notificationTitle,
          message: notificationMessage
        });
      
      if (error) throw error;
      
      // Note: Telegram message only works for users who registered via Telegram bot
      // Web users will only see in-app notifications in their profile
      
      toast.success("নোটিফিকেশন সেভ হয়েছে (ইউজার প্রোফাইলে দেখা যাবে)");
      setIsSendingNotification(false);
      setNotificationUser(null);
      setNotificationTitle("");
      setNotificationMessage("");
    } catch (error: any) {
      toast.error(error.message || "নোটিফিকেশন পাঠাতে সমস্যা হয়েছে");
    } finally {
      setSendingNotification(false);
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
      {/* Edit Balance Dialog */}
      <Dialog open={isEditingBalance} onOpenChange={setIsEditingBalance}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              ব্যালেন্স এডিট করুন
            </DialogTitle>
            <DialogDescription>
              @{editingUser?.telegram_username || editingUser?.telegram_user_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>নতুন ব্যালেন্স (৳)</Label>
              <Input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="h-12 rounded-xl text-center text-lg"
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsEditingBalance(false)}
              >
                <X className="w-4 h-4 mr-2" />
                বাতিল
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveBalance}
                disabled={savingBalance}
              >
                <Save className="w-4 h-4 mr-2" />
                সেভ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={isSendingNotification} onOpenChange={setIsSendingNotification}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              নোটিফিকেশন পাঠান
            </DialogTitle>
            <DialogDescription>
              @{notificationUser?.telegram_username || notificationUser?.telegram_user_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>টাইটেল</Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="নোটিফিকেশন টাইটেল"
              />
            </div>
            <div className="space-y-2">
              <Label>মেসেজ</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="rounded-xl min-h-[100px]"
                placeholder="নোটিফিকেশন মেসেজ লিখুন..."
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl"
              onClick={handleSendNotification}
              disabled={sendingNotification}
            >
              <Bell className="w-4 h-4 mr-2" />
              পাঠান
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">মোট ইউজার</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">মোট ব্যালেন্স</p>
                <p className="text-2xl font-bold text-card-foreground">৳{stats.totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">মোট আয়</p>
                <p className="text-2xl font-bold text-card-foreground">৳{stats.totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => { fetchBalances(); fetchNumberCounts(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          রিফ্রেশ
        </Button>
        <Button onClick={processPendingCredits}>
          ২৪ ঘন্টা ক্রেডিট প্রসেস করুন
        </Button>
      </div>

      {/* User List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">ইউজার তালিকা</h3>
        {balances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">কোন ইউজার নেই</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {balances.map((user) => (
              <Card key={user.id} className="border-border">
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-card-foreground">
                          @{user.telegram_username || user.telegram_user_id}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.telegram_user_id.substring(0, 12)}...
                        </p>
                        {user.referral_code && (
                          <p className="text-xs text-muted-foreground mt-1">
                            রেফারাল কোড: <span className="font-mono">{user.referral_code}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ৳{Number(user.balance).toFixed(2)}
                        </Badge>
                        <Badge variant="secondary">
                          ✅ {user.successful_numbers} সম্পন্ন
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {numberCounts[user.telegram_user_id] || 0} নম্বর
                        </Badge>
                        <Badge variant="secondary">
                          📊 ৳{Number(user.total_earned).toFixed(2)} আয়
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditBalance(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        ব্যালেন্স এডিট
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenNotification(user)}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        নোটিফিকেশন
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