import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Loader2, 
  Wallet, 
  Phone, 
  Gift, 
  Clock, 
  CheckCircle,
  XCircle,
  Copy,
  Plus,
  Home,
  History,
  Users,
  User,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  Send,
  Star,
  Banknote,
  Smartphone
} from "lucide-react";
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
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { NumberWaitingDialog } from "@/components/dashboard/NumberWaitingDialog";

interface AppSettings {
  welcome_bonus: number;
  referral_bonus: number;
  per_number_earning: number;
  min_withdrawal: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isAddingNumber, setIsAddingNumber] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isConfirmingNumber, setIsConfirmingNumber] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bkash");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [waitingDialogOpen, setWaitingDialogOpen] = useState(false);
  const [currentWaitingRequest, setCurrentWaitingRequest] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      const settings: AppSettings = {
        welcome_bonus: 20,
        referral_bonus: 20,
        per_number_earning: 15, // 15 taka per 24 hours per number
        min_withdrawal: 100
      };
      data?.forEach((s: any) => {
        if (s.setting_key in settings) {
          (settings as any)[s.setting_key] = parseFloat(s.setting_value);
        }
      });
      return settings;
    }
  });

  // Fetch user balance
  const { data: userBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('telegram_user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user's number requests
  const { data: numberRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['user-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('number_requests')
        .select('*')
        .eq('telegram_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch withdrawals
  const { data: withdrawals } = useQuery({
    queryKey: ['user-withdrawals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  // Fetch referrals
  const { data: referrals } = useQuery({
    queryKey: ['user-referrals', user?.id],
    queryFn: async () => {
      if (!user || !userBalance?.referral_code) return [];
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_telegram_id', user.id);
      return data || [];
    },
    enabled: !!user && !!userBalance
  });

  // Create user balance if not exists
  useEffect(() => {
    const createBalance = async () => {
      if (user && !balanceLoading && !userBalance) {
        const referralCode = `REF${user.id.substring(0, 8).toUpperCase()}`;
        await supabase.from('user_balances').insert({
          telegram_user_id: user.id,
          telegram_username: user.user_metadata?.name || user.email,
          referral_code: referralCode,
          balance: 0,
          total_earned: 0,
          successful_numbers: 0,
          welcome_bonus_claimed: false
        });
        queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      }
    };
    createBalance();
  }, [user, userBalance, balanceLoading, queryClient]);

  // Claim welcome bonus mutation
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      if (!userBalance || userBalance.welcome_bonus_claimed) {
        throw new Error("বোনাস ইতোমধ্যে নেওয়া হয়েছে");
      }
      
      const bonusAmount = appSettings?.welcome_bonus || 20;
      
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          balance: (userBalance.balance || 0) + bonusAmount,
          total_earned: (userBalance.total_earned || 0) + bonusAmount,
          welcome_bonus_claimed: true 
        })
        .eq('telegram_user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`🎉 ৳${appSettings?.welcome_bonus || 20} স্বাগতম বোনাস পেয়েছেন!`);
      setClaimingBonus(false);
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "বোনাস নিতে সমস্যা হয়েছে");
    }
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      const minWithdraw = appSettings?.min_withdrawal || 100;
      
      if (!amount || amount < minWithdraw) {
        throw new Error(`সর্বনিম্ন ৳${minWithdraw} উইথড্র করতে হবে`);
      }
      
      if (amount > (userBalance?.balance || 0)) {
        throw new Error("অপর্যাপ্ত ব্যালেন্স");
      }
      
      if (!withdrawAccount || withdrawAccount.length < 11) {
        throw new Error("সঠিক অ্যাকাউন্ট নম্বর দিন");
      }

      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email,
        amount: amount,
        payment_method: withdrawMethod,
        account_number: withdrawAccount,
        status: 'pending'
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!");
      setIsWithdrawing(false);
      setWithdrawAmount("");
      setWithdrawAccount("");
      queryClient.invalidateQueries({ queryKey: ['user-withdrawals'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "উইথড্র রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে");
    }
  });

  // Add number mutation
  const addNumberMutation = useMutation({
    mutationFn: async (phone: string) => {
      const { data, error } = await supabase.from('number_requests').insert({
        telegram_user_id: user.id,
        telegram_username: user.user_metadata?.name || user.email,
        phone_number: phone,
        status: 'pending'
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("নম্বর সফলভাবে জমা হয়েছে!");
      setPhoneNumber("");
      setIsAddingNumber(false);
      // Open waiting dialog with the new request
      setCurrentWaitingRequest(data);
      setWaitingDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
    },
    onError: () => {
      toast.error("নম্বর জমা দিতে সমস্যা হয়েছে");
    }
  });

  // Submit verification code mutation
  const submitCodeMutation = useMutation({
    mutationFn: async ({ requestId, code }: { requestId: string; code: string }) => {
      const { error } = await supabase
        .from('number_requests')
        .update({ 
          verification_code: code,
          code_sent_at: new Date().toISOString(),
          status: 'code_received'
        })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("কোড সফলভাবে জমা হয়েছে!");
      setVerificationCode("");
      setSelectedRequest(null);
      setIsSubmittingCode(false);
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
    },
    onError: () => {
      toast.error("কোড জমা দিতে সমস্যা হয়েছে");
    }
  });

  // Confirm number mutation
  const confirmNumberMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('number_requests')
        .update({ status: 'confirmed' })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("নম্বর কনফার্ম হয়েছে!");
      setIsConfirmingNumber(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
    },
    onError: () => {
      toast.error("কনফার্ম করতে সমস্যা হয়েছে");
    }
  });

  const handleAddNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error("সঠিক মোবাইল নম্বর দিন");
      return;
    }
    addNumberMutation.mutate(phoneNumber);
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !selectedRequest) {
      toast.error("কোড দিন");
      return;
    }
    submitCodeMutation.mutate({ requestId: selectedRequest.id, code: verificationCode });
  };

  const copyReferralCode = () => {
    if (userBalance?.referral_code) {
      navigator.clipboard.writeText(userBalance.referral_code);
      toast.success("কোড কপি হয়েছে!");
    }
  };

  // Calculate time elapsed and progress for 24-hour countdown
  const getTimeElapsed = (approvedAt: string | null, createdAt: string) => {
    const startTime = approvedAt ? new Date(approvedAt) : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours >= 24) {
      return { text: "২৪ ঘন্টা পূর্ণ", progress: 100, completed: true };
    }
    
    const progress = Math.min(100, (diffMs / (24 * 60 * 60 * 1000)) * 100);
    
    if (diffHours > 0) {
      return { text: `${diffHours} ঘন্টা ${diffMinutes} মিনিট`, progress, completed: false };
    }
    return { text: `${diffMinutes} মিনিট`, progress, completed: false };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-0"><Clock className="w-3 h-3 mr-1" />অপেক্ষমান</Badge>;
      case 'code_sent':
        return <Badge className="bg-blue-500/20 text-blue-600 border-0"><Send className="w-3 h-3 mr-1" />কোড এসেছে</Badge>;
      case 'code_received':
        return <Badge className="bg-purple-500/20 text-purple-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />কোড জমা</Badge>;
      case 'confirmed':
        return <Badge className="bg-cyan-500/20 text-cyan-600 border-0"><Star className="w-3 h-3 mr-1" />কনফার্মড</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />সম্পন্ন</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-600 border-0"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWithdrawStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-0"><Clock className="w-3 h-3 mr-1" />প্রসেসিং</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />সম্পন্ন</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-0"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedReferrals = referrals?.filter(r => r.is_completed).length || 0;
  const pendingReferrals = referrals?.filter(r => !r.is_completed).length || 0;
  const showWelcomeBonus = userBalance && !userBalance.welcome_bonus_claimed;

  // Handle confirm from waiting dialog
  const handleWaitingDialogConfirm = async () => {
    if (!currentWaitingRequest) return;
    
    try {
      const { error } = await supabase
        .from('number_requests')
        .update({ 
          code_sent_at: new Date().toISOString(),
          status: 'code_received'
        })
        .eq('id', currentWaitingRequest.id);
      
      if (error) throw error;
      
      toast.success("কনফার্ম হয়েছে!");
      setWaitingDialogOpen(false);
      setCurrentWaitingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
    } catch (error) {
      toast.error("কনফার্ম করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20">
      {/* Number Waiting Dialog */}
      <NumberWaitingDialog
        open={waitingDialogOpen}
        onOpenChange={setWaitingDialogOpen}
        request={currentWaitingRequest}
        onConfirm={handleWaitingDialogConfirm}
        isSubmitting={false}
      />

      {/* Add Number Dialog */}
      <Dialog open={isAddingNumber} onOpenChange={setIsAddingNumber}>
        <DialogContent className="max-w-[340px] rounded-2xl p-0 overflow-hidden">
          <div className="bg-card p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                নতুন নম্বর যোগ করুন
              </DialogTitle>
              <DialogDescription>আপনার মোবাইল নম্বর দিন</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddNumber} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">মোবাইল নম্বর</Label>
                <Input
                  type="tel"
                  placeholder="01XXX✱✱✱✱✱✱"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 rounded-xl text-center text-lg font-mono bg-muted/50 border-border"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={addNumberMutation.isPending}>
                {addNumberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                জমা দিন
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Code Dialog */}
      <Dialog open={isSubmittingCode} onOpenChange={setIsSubmittingCode}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              ভেরিফিকেশন কোড
            </DialogTitle>
            <DialogDescription>{selectedRequest?.phone_number} নম্বরে আসা কোড দিন</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div className="space-y-2">
              <Label>কোড</Label>
              <Input
                type="text"
                placeholder="কোড দিন"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-12 rounded-xl text-center text-lg tracking-widest"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80" disabled={submitCodeMutation.isPending}>
              {submitCodeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              সাবমিট করুন
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Number Dialog */}
      <Dialog open={isConfirmingNumber} onOpenChange={setIsConfirmingNumber}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-green-500" />
              নম্বর কনফার্ম করুন
            </DialogTitle>
            <DialogDescription>{selectedRequest?.phone_number} নম্বরটি সঠিকভাবে ভেরিফাই হয়েছে?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl text-center">
              <p className="text-sm text-muted-foreground mb-1">জমা দেওয়া কোড</p>
              <p className="text-2xl font-mono font-bold text-primary">{selectedRequest?.verification_code}</p>
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600"
              disabled={confirmNumberMutation.isPending}
              onClick={() => confirmNumberMutation.mutate(selectedRequest?.id)}
            >
              {confirmNumberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              হ্যাঁ, কনফার্ম করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Bonus Dialog */}
      <Dialog open={claimingBonus} onOpenChange={setClaimingBonus}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              স্বাগতম বোনাস!
            </DialogTitle>
            <DialogDescription>𝗧𝗮𝗽 𝗟𝗶𝗻𝗸 এ স্বাগতম!</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl text-center">
              <Gift className="w-16 h-16 mx-auto text-amber-500 mb-3 animate-bounce" />
              <p className="text-4xl font-bold text-amber-600">৳{appSettings?.welcome_bonus || 20}</p>
              <p className="text-sm text-muted-foreground mt-1">স্বাগতম বোনাস</p>
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              disabled={claimBonusMutation.isPending}
              onClick={() => claimBonusMutation.mutate()}
            >
              {claimBonusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Sparkles className="w-4 h-4 mr-2" />
              বোনাস নিন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawing} onOpenChange={setIsWithdrawing}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-500" />
              উইথড্র করুন
            </DialogTitle>
            <DialogDescription>আপনার ব্যালেন্স: ৳{userBalance?.balance || 0}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>অ্যামাউন্ট (৳)</Label>
              <Input
                type="number"
                placeholder={`সর্বনিম্ন ৳${appSettings?.min_withdrawal || 100}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-12 rounded-xl text-center text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>পেমেন্ট মেথড</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-pink-500" />
                      বিকাশ
                    </div>
                  </SelectItem>
                  <SelectItem value="nagad">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-orange-500" />
                      নগদ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{withdrawMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বর</Label>
              <Input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className="h-12 rounded-xl text-center text-lg"
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600"
              disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate()}
            >
              {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Banknote className="w-4 h-4 mr-2" />
              উইথড্র রিকোয়েস্ট
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {activeTab === "home" && (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-muted-foreground text-sm">স্বাগতম 👋</p>
                <h1 className="text-xl font-bold text-foreground">{user.user_metadata?.name || 'ইউজার'}</h1>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>

            {/* Welcome Bonus */}
            {showWelcomeBonus && (
              <Card 
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setClaimingBonus(true)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center animate-pulse">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-600">৳{appSettings?.welcome_bonus || 20} স্বাগতম বোনাস!</p>
                      <p className="text-xs text-muted-foreground">ক্লিক করে বোনাস নিন</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-600" />
                </CardContent>
              </Card>
            )}

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 border-0 overflow-hidden relative shadow-xl shadow-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-primary-foreground/80" />
                  <span className="text-primary-foreground/80 text-sm">মোট ব্যালেন্স</span>
                </div>
                <p className="text-4xl font-bold text-primary-foreground mb-4">৳{userBalance?.balance || 0}</p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 rounded-xl p-3">
                    <p className="text-primary-foreground/70 text-xs">মোট আয়</p>
                    <p className="text-primary-foreground font-bold">৳{userBalance?.total_earned || 0}</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl p-3">
                    <p className="text-primary-foreground/70 text-xs">সফল নম্বর</p>
                    <p className="text-primary-foreground font-bold">{userBalance?.successful_numbers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Card 
                className="border-border hover:border-primary/50 transition-all cursor-pointer active:scale-95"
                onClick={() => setIsAddingNumber(true)}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-xs">নম্বর যোগ</p>
                </CardContent>
              </Card>
              <Card 
                className="border-border hover:border-primary/50 transition-all cursor-pointer active:scale-95"
                onClick={() => navigate('/withdraw')}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-xs">উইথড্র</p>
                </CardContent>
              </Card>
              <Card 
                className="border-border hover:border-amber-500/50 transition-all cursor-pointer active:scale-95"
                onClick={() => setActiveTab("referral")}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center mx-auto mb-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="font-medium text-foreground text-xs">রেফার</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">৳{appSettings?.per_number_earning || 15}</p>
                  <p className="text-[10px] text-muted-foreground">প্রতি নম্বর</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
                <CardContent className="p-3 text-center">
                  <Award className="w-5 h-5 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold text-foreground">৳{appSettings?.referral_bonus || 20}</p>
                  <p className="text-[10px] text-muted-foreground">রেফারেল</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <CardContent className="p-3 text-center">
                  <Sparkles className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-lg font-bold text-foreground">{completedReferrals}</p>
                  <p className="text-[10px] text-muted-foreground">সফল রেফার</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">সাম্প্রতিক কার্যক্রম</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')} className="text-xs text-primary">
                  সব দেখুন <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : numberRequests?.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-8 text-center">
                    <Phone className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">কোনো নম্বর জমা দেননি</p>
                    <Button variant="link" className="text-primary mt-2" onClick={() => setIsAddingNumber(true)}>
                      এখনই যোগ করুন
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {numberRequests?.slice(0, 3).map((request) => (
                    <Card 
                      key={request.id} 
                      className="border-border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        if (['pending', 'code_sent', 'code_received'].includes(request.status)) {
                          setCurrentWaitingRequest(request);
                          setWaitingDialogOpen(true);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Phone className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{request.phone_number}</p>
                              <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString('bn-BD')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(request.status)}
                            {request.status === 'pending' && (
                              <span className="text-xs text-muted-foreground">ট্যাপ করুন</span>
                            )}
                            {request.status === 'code_sent' && (
                              <span className="text-xs text-blue-500 animate-pulse">কোড এসেছে!</span>
                            )}
                          </div>
                        </div>
                        {/* Show 24-hour countdown for completed/approved numbers */}
                        {(request.status === 'completed' || request.approved_at) && !request.balance_credited && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {(() => {
                              const elapsed = getTimeElapsed(request.approved_at, request.created_at);
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      সময় অতিবাহিত: {elapsed.text}
                                    </span>
                                    <span className="text-primary font-medium">
                                      {elapsed.completed ? "✓ ব্যালেন্স যোগ হবে" : `${Math.round(elapsed.progress)}%`}
                                    </span>
                                  </div>
                                  <Progress value={elapsed.progress} className="h-1.5" />
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {request.balance_credited && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                ৳{appSettings?.per_number_earning || 15} যোগ হয়েছে
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Withdrawals */}
            {withdrawals && withdrawals.length > 0 && (
              <div>
                <h2 className="font-semibold text-foreground mb-3">সাম্প্রতিক উইথড্র</h2>
                <div className="space-y-2">
                  {withdrawals.slice(0, 2).map((w: any) => (
                    <Card key={w.id} className="border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Banknote className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">৳{w.amount}</p>
                              <p className="text-xs text-muted-foreground">{w.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'} - {w.account_number}</p>
                            </div>
                          </div>
                          {getWithdrawStatusBadge(w.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-foreground pt-2">আমার নম্বরসমূহ</h1>
            
            <Button className="w-full h-12 rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg" onClick={() => setIsAddingNumber(true)}>
              <Plus className="w-5 h-5" />
              নতুন নম্বর যোগ করুন
            </Button>

            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : numberRequests?.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Phone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">কোনো নম্বর রিকোয়েস্ট নেই</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {numberRequests?.map((request) => (
                  <Card 
                    key={request.id} 
                    className="border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (['pending', 'code_sent', 'code_received'].includes(request.status)) {
                        setCurrentWaitingRequest(request);
                        setWaitingDialogOpen(true);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{request.phone_number}</p>
                            <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {getStatusBadge(request.status)}
                          {request.status === 'pending' && (
                            <span className="text-xs text-muted-foreground mt-1">অপেক্ষা করুন</span>
                          )}
                          {request.status === 'code_sent' && (
                            <span className="text-xs text-blue-500 animate-pulse mt-1">কোড এসেছে!</span>
                          )}
                        </div>
                      </div>
                      {request.verification_code && request.status !== 'code_sent' && request.status !== 'pending' && (
                        <div className="mt-2 p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">কোড: <span className="font-mono font-bold text-primary">{request.verification_code}</span></p>
                        </div>
                      )}
                      {request.rejection_reason && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded-lg">
                          <p className="text-xs text-destructive">কারণ: {request.rejection_reason}</p>
                        </div>
                      )}
                      {/* Show 24-hour countdown for completed/approved numbers */}
                      {(request.status === 'completed' || request.approved_at) && !request.balance_credited && (
                        <div className="mt-3 pt-3 border-t border-border">
                          {(() => {
                            const elapsed = getTimeElapsed(request.approved_at, request.created_at);
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    সময় অতিবাহিত: {elapsed.text}
                                  </span>
                                  <span className="text-primary font-medium">
                                    {elapsed.completed ? "✓ ব্যালেন্স যোগ হবে" : `${Math.round(elapsed.progress)}%`}
                                  </span>
                                </div>
                                <Progress value={elapsed.progress} className="h-1.5" />
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {request.balance_credited && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              ৳{appSettings?.per_number_earning || 15} যোগ হয়েছে
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "referral" && (
          <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-foreground pt-2">রেফারেল প্রোগ্রাম</h1>

            {/* Referral Bonus Card - matching reference */}
            <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 border-0 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 text-center relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-foreground/20 flex items-center justify-center mb-3">
                  <Gift className="w-8 h-8 text-primary-foreground" />
                </div>
                <p className="text-primary-foreground/80 text-sm mb-1">প্রতি রেফারে পান</p>
                <p className="text-4xl font-bold text-primary-foreground">৳{appSettings?.referral_bonus || 20}</p>
              </CardContent>
            </Card>

            {/* Referral Code Card */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm text-muted-foreground">আপনার রেফারেল কোড</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 bg-muted/50 rounded-xl border border-border text-center">
                    <code className="text-xl font-mono font-bold text-foreground tracking-wider">{userBalance?.referral_code || '...'}</code>
                  </div>
                  <Button size="icon" className="h-14 w-14 rounded-xl bg-primary hover:bg-primary/90" onClick={copyReferralCode}>
                    <Copy className="w-5 h-5 text-primary-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it works Card */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-foreground">কিভাবে কাজ করে?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">১</div>
                    <p className="text-sm text-muted-foreground">আপনার রেফারেল লিংক শেয়ার করুন</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">২</div>
                    <p className="text-sm text-muted-foreground">বন্ধু রেজিস্ট্রেশন করে ২টি সফল নম্বর দিলে</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">৩</div>
                    <p className="text-sm text-muted-foreground">আপনি ৳{appSettings?.referral_bonus || 20} বোনাস পাবেন!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{completedReferrals}</p>
                  <p className="text-xs text-muted-foreground">সফল রেফারেল</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{pendingReferrals}</p>
                  <p className="text-xs text-muted-foreground">পেন্ডিং</p>
                </CardContent>
              </Card>
            </div>

            {/* Copy Link Button */}
            <Button className="w-full h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={copyReferralCode}>
              <Copy className="w-5 h-5" />
              কোড কপি করুন
            </Button>
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileTab 
            user={user} 
            userBalance={userBalance} 
            completedReferrals={completedReferrals} 
            navigate={navigate} 
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around py-2">
          {[
            { id: "home", icon: Home, label: "হোম", action: () => setActiveTab("home") },
            { id: "history", icon: History, label: "ইতিহাস", action: () => navigate('/transactions') },
            { id: "leaderboard", icon: Award, label: "লিডারবোর্ড", action: () => navigate('/leaderboard') },
            { id: "referral", icon: Users, label: "রেফার", action: () => setActiveTab("referral") },
            { id: "profile", icon: User, label: "প্রোফাইল", action: () => setActiveTab("profile") },
          ].map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.id ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;