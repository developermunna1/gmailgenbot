import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  Phone,
  Users,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  type: 'earning' | 'bonus' | 'referral' | 'withdrawal';
  amount: number;
  status: string;
  description: string;
  date: string;
  details?: string;
}

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  }, [navigate]);

  // Fetch user balance for bonuses
  const { data: userBalance } = useQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_balances')
        .select('*')
        .eq('telegram_user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  // Fetch number requests (earnings)
  const { data: numberRequests } = useQuery({
    queryKey: ['user-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('number_requests')
        .select('*')
        .eq('telegram_user_id', user.id)
        .order('created_at', { ascending: false });
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
      if (!user) return [];
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_telegram_id', user.id)
        .eq('is_completed', true);
      return data || [];
    },
    enabled: !!user
  });

  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      const settings: any = {
        welcome_bonus: 20,
        referral_bonus: 20,
        per_number_earning: 15
      };
      data?.forEach((s: any) => {
        if (s.setting_key in settings) {
          settings[s.setting_key] = parseFloat(s.setting_value);
        }
      });
      return settings;
    }
  });

  // Combine all transactions
  const transactions: Transaction[] = [];

  // Add welcome bonus if claimed
  if (userBalance?.welcome_bonus_claimed) {
    transactions.push({
      id: 'welcome-bonus',
      type: 'bonus',
      amount: appSettings?.welcome_bonus || 20,
      status: 'completed',
      description: 'স্বাগতম বোনাস',
      date: userBalance.created_at,
      details: 'Welcome Bonus'
    });
  }

  // Add number earnings
  numberRequests?.forEach((req: any) => {
    if (req.status === 'completed' && req.balance_credited) {
      transactions.push({
        id: `earning-${req.id}`,
        type: 'earning',
        amount: appSettings?.per_number_earning || 15,
        status: 'completed',
        description: `নম্বর ভেরিফিকেশন - ${req.phone_number}`,
        date: req.approved_at || req.updated_at,
        details: req.phone_number
      });
    }
  });

  // Add referral bonuses
  referrals?.forEach((ref: any) => {
    if (ref.is_completed && ref.commission_paid) {
      transactions.push({
        id: `referral-${ref.id}`,
        type: 'referral',
        amount: appSettings?.referral_bonus || 20,
        status: 'completed',
        description: 'রেফারেল বোনাস',
        date: ref.completed_at || ref.created_at,
        details: `Referred: ${ref.referred_telegram_id.substring(0, 8)}...`
      });
    }
  });

  // Add withdrawals
  withdrawals?.forEach((w: any) => {
    transactions.push({
      id: `withdrawal-${w.id}`,
      type: 'withdrawal',
      amount: w.amount,
      status: w.status,
      description: `উইথড্র - ${w.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'}`,
      date: w.created_at,
      details: w.account_number
    });
  });

  // Sort by date
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (startDate && new Date(t.date) < new Date(startDate)) return false;
    if (endDate && new Date(t.date) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <Phone className="w-5 h-5 text-primary" />;
      case 'bonus':
        return <Gift className="w-5 h-5 text-amber-500" />;
      case 'referral':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'withdrawal':
        return <ArrowUpCircle className="w-5 h-5 text-destructive" />;
      default:
        return <ArrowDownCircle className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary/20 text-primary border-0"><CheckCircle className="w-3 h-3 mr-1" />সম্পন্ন</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-0"><Clock className="w-3 h-3 mr-1" />প্রসেসিং</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-0"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalEarnings = transactions
    .filter(t => t.type !== 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-primary p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-primary-foreground flex-1 text-center pr-10">Transaction History</h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <ArrowDownCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">৳{totalEarnings}</p>
              <p className="text-xs text-muted-foreground">মোট আয়</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 text-center">
              <ArrowUpCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
              <p className="text-2xl font-bold text-destructive">৳{totalWithdrawals}</p>
              <p className="text-xs text-muted-foreground">মোট উইথড্র</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">ফিল্টার</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="earning">আয়</SelectItem>
                <SelectItem value="bonus">বোনাস</SelectItem>
                <SelectItem value="referral">রেফারেল</SelectItem>
                <SelectItem value="withdrawal">উইথড্র</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-lg text-xs"
              placeholder="শুরু"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-lg text-xs"
              placeholder="শেষ"
            />
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-4 space-y-3">
          {filteredTransactions.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">কোনো ট্রানজ্যাকশন নেই</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'withdrawal' 
                        ? 'bg-destructive/10' 
                        : 'bg-primary/10'
                    }`}>
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'withdrawal' 
                          ? 'text-destructive' 
                          : 'text-primary'
                      }`}>
                        {transaction.type === 'withdrawal' ? '-' : '+'}৳{transaction.amount}
                      </p>
                      {transaction.details && (
                        <p className="text-xs text-muted-foreground">{transaction.details}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
