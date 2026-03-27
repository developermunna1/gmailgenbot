import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  Wallet,
  Smartphone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_name: string | null;
  amount: number;
  payment_method: string;
  account_number: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

export const WithdrawalsPanel = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [processDialog, setProcessDialog] = useState<{ 
    open: boolean; 
    withdrawal: WithdrawalRequest | null;
    action: 'approve' | 'reject';
  }>({
    open: false,
    withdrawal: null,
    action: 'approve'
  });
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("উইথড্র রিকোয়েস্ট লোড করতে সমস্যা হয়েছে");
    } else {
      setWithdrawals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();

    const channel = supabase
      .channel("withdrawal_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processWithdrawal = async () => {
    if (!processDialog.withdrawal) return;

    setProcessing(true);
    const newStatus = processDialog.action === 'approve' ? 'completed' : 'rejected';
    
    try {
      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: newStatus,
          admin_note: adminNote || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", processDialog.withdrawal.id);

      if (updateError) throw updateError;

      // If approved, deduct from user balance
      if (processDialog.action === 'approve') {
        const { data: userBalance } = await supabase
          .from("user_balances")
          .select("balance")
          .eq("telegram_user_id", processDialog.withdrawal.user_id)
          .maybeSingle();

        if (userBalance) {
          await supabase
            .from("user_balances")
            .update({ 
              balance: Math.max(0, (userBalance.balance || 0) - processDialog.withdrawal.amount)
            })
            .eq("telegram_user_id", processDialog.withdrawal.user_id);
        }
      }

      toast.success(processDialog.action === 'approve' ? "উইথড্র অ্যাপ্রুভ হয়েছে" : "উইথড্র রিজেক্ট হয়েছে");
      setProcessDialog({ open: false, withdrawal: null, action: 'approve' });
      setAdminNote("");
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("উইথড্র প্রসেস করতে সমস্যা হয়েছে");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-0"><Clock className="w-3 h-3 mr-1" />অপেক্ষমাণ</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />সম্পন্ন</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-0"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = method === 'bkash' 
      ? 'bg-pink-500/20 text-pink-600' 
      : 'bg-orange-500/20 text-orange-600';
    return (
      <Badge className={`${colors} border-0`}>
        <Smartphone className="w-3 h-3 mr-1" />
        {method === 'bkash' ? 'বিকাশ' : 'নগদ'}
      </Badge>
    );
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const stats = {
    pending: withdrawals.filter(w => w.status === "pending").length,
    completed: withdrawals.filter(w => w.status === "completed").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
    totalPending: withdrawals.filter(w => w.status === "pending").reduce((acc, w) => acc + w.amount, 0),
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">অপেক্ষমাণ</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Wallet className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">৳{stats.totalPending}</p>
            <p className="text-xs text-muted-foreground">পেন্ডিং অ্যামাউন্ট</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">সম্পন্ন</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">বাতিল</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">সব ({withdrawals.length})</TabsTrigger>
            <TabsTrigger value="pending">অপেক্ষমাণ</TabsTrigger>
            <TabsTrigger value="completed">সম্পন্ন</TabsTrigger>
            <TabsTrigger value="rejected">বাতিল</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={fetchWithdrawals} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      {/* List */}
      {filteredWithdrawals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">কোন উইথড্র রিকোয়েস্ট নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      💰 ৳{withdrawal.amount}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      👤 {withdrawal.user_name || withdrawal.user_id.substring(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(withdrawal.status)}
                    {getPaymentMethodBadge(withdrawal.payment_method)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">অ্যাকাউন্ট নম্বর</p>
                    <p className="font-mono text-lg font-bold text-foreground">{withdrawal.account_number}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    📅 {new Date(withdrawal.created_at).toLocaleString("bn-BD")}
                  </p>

                  {withdrawal.admin_note && (
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <p className="text-sm text-blue-600">📝 নোট: {withdrawal.admin_note}</p>
                    </div>
                  )}

                  {withdrawal.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setProcessDialog({ open: true, withdrawal, action: 'approve' });
                          setAdminNote("");
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        অ্যাপ্রুভ
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProcessDialog({ open: true, withdrawal, action: 'reject' });
                          setAdminNote("");
                        }}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        রিজেক্ট
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Process Dialog */}
      <Dialog open={processDialog.open} onOpenChange={(open) => setProcessDialog({ ...processDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {processDialog.action === 'approve' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  উইথড্র অ্যাপ্রুভ করুন
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  উইথড্র রিজেক্ট করুন
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {processDialog.action === 'approve' 
                ? "এই উইথড্র অ্যাপ্রুভ করলে ব্যালেন্স কেটে নেওয়া হবে।"
                : "এই উইথড্র রিজেক্ট করার কারণ লিখুন।"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">অ্যামাউন্ট</span>
                <span className="font-bold text-lg">৳{processDialog.withdrawal?.amount}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">অ্যাকাউন্ট</span>
                <span className="font-mono">{processDialog.withdrawal?.account_number}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>নোট (ঐচ্ছিক)</Label>
              <Textarea
                placeholder="অ্যাডমিন নোট..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialog({ open: false, withdrawal: null, action: 'approve' })}>
              বাতিল
            </Button>
            <Button 
              onClick={processWithdrawal} 
              disabled={processing}
              className={processDialog.action === 'approve' 
                ? "bg-gradient-to-r from-green-500 to-green-600" 
                : "bg-gradient-to-r from-red-500 to-red-600"
              }
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : processDialog.action === 'approve' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {processDialog.action === 'approve' ? 'অ্যাপ্রুভ' : 'রিজেক্ট'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};