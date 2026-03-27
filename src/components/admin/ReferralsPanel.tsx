import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Users, CheckCircle, Clock } from "lucide-react";

interface Referral {
  id: string;
  referrer_telegram_id: string;
  referred_telegram_id: string;
  is_completed: boolean;
  commission_paid: boolean;
  created_at: string;
  completed_at: string | null;
}

export const ReferralsPanel = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referrals:", error);
      toast.error("রেফারাল লোড করতে সমস্যা হয়েছে");
    } else {
      setReferrals(data || []);
      
      const refs = data || [];
      setStats({
        total: refs.length,
        completed: refs.filter(r => r.is_completed).length,
        pending: refs.filter(r => !r.is_completed).length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">মোট রেফারাল</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">সম্পন্ন</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">অপেক্ষমাণ</p>
                <p className="text-2xl font-bold text-card-foreground">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">রেফারাল তালিকা</h3>
        <Button variant="outline" onClick={fetchReferrals}>
          <RefreshCw className="w-4 h-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      {referrals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">কোন রেফারাল নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {referrals.map((referral) => (
            <Card key={referral.id} className="border-border">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">রেফারার:</span>
                      <span className="font-mono text-card-foreground">{referral.referrer_telegram_id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">রেফার্ড:</span>
                      <span className="font-mono text-card-foreground">{referral.referred_telegram_id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(referral.created_at).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {referral.is_completed ? (
                      <Badge className="bg-green-600 text-white">✅ সম্পন্ন</Badge>
                    ) : (
                      <Badge variant="secondary">⏳ অপেক্ষমাণ</Badge>
                    )}
                    {referral.commission_paid && (
                      <Badge className="bg-blue-600 text-white">💰 পেইড</Badge>
                    )}
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
