import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, CheckCircle2, Clock, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

interface GmailRequest {
  id: string;
  telegram_user_id: string;
  email: string;
  otp_code: string | null;
  domain: string;
  status: string;
  created_at: string;
}

export const GmailRequestsPanel = () => {
  const [requests, setRequests] = useState<GmailRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gmail_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gmail requests:", error);
      toast.error("জিমেইল রিকোয়েস্ট লোড করতে সমস্যা হয়েছে");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("gmail_requests")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
    } else {
      toast.success("সফলভাবে ডিলিট হয়েছে");
      fetchRequests();
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">জিমেইল রিকোয়েস্ট তালিকা</h3>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="w-4 h-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">কোন জিমেইল রিকোয়েস্ট নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-border">
              <CardContent className="py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-card-foreground">{req.email}</h4>
                        <p className="text-xs text-muted-foreground">ইউজার ID: {req.telegram_user_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={req.status === "completed" ? "default" : "secondary"} className={req.status === "completed" ? "bg-green-500 hover:bg-green-600" : ""}>
                        {req.status === "completed" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {req.status === "completed" ? "সম্পন্ন" : "পেন্ডিং"}
                      </Badge>
                      <Badge variant="outline">{req.domain}</Badge>
                    </div>
                  </div>
                  
                  {req.otp_code && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border">
                      <Key className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold">কোড: {req.otp_code}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(req.created_at).toLocaleString('bn-BD')}
                    </span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(req.id)}>
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
  );
};
