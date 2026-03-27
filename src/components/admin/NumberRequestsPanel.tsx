import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Check, X, RefreshCw, Clock, CheckCircle, Star, XCircle, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NumberRequest {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  phone_number: string;
  service_name: string | null;
  status: string;
  verification_code: string | null;
  code_sent_at: string | null;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
}

export const NumberRequestsPanel = () => {
  const [requests, setRequests] = useState<NumberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [sendingCode, setSendingCode] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: NumberRequest | null }>({
    open: false,
    request: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("number_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      toast.error("রিকোয়েস্ট লোড করতে সমস্যা হয়েছে");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("number_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "number_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendVerificationCode = async (request: NumberRequest) => {
    const code = codes[request.id];
    const customMessage = messages[request.id] || "";
    
    if (!code) {
      toast.error("ভেরিফিকেশন কোড লিখুন");
      return;
    }

    setSendingCode(request.id);

    try {
      const { error: updateError } = await supabase
        .from("number_requests")
        .update({
          verification_code: code,
          code_sent_at: new Date().toISOString(),
          status: "code_sent",
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      let messageText = `🔐 আপনার ভেরিফিকেশন কোড: ${code}\n📱 নম্বর: ${request.phone_number}`;
      if (customMessage) {
        messageText += `\n\n💬 ${customMessage}`;
      }

      // Try to send Telegram message (may fail for web users who don't have real Telegram IDs)
      try {
        const { error: functionError } = await supabase.functions.invoke("send-telegram-message", {
          body: {
            telegram_user_id: request.telegram_user_id,
            message: messageText,
          },
        });

        if (functionError) {
          console.log("Telegram message not sent (web user):", functionError);
        }
      } catch (telegramError) {
        console.log("Telegram send skipped:", telegramError);
      }

      toast.success("কোড সফলভাবে সেভ হয়েছে");
      setCodes((prev) => ({ ...prev, [request.id]: "" }));
      setMessages((prev) => ({ ...prev, [request.id]: "" }));
    } catch (error) {
      console.error("Error sending code:", error);
      toast.error("কোড পাঠাতে সমস্যা হয়েছে");
    } finally {
      setSendingCode(null);
    }
  };

  const approveNumber = async (request: NumberRequest) => {
    try {
      const { error: updateError } = await supabase
        .from("number_requests")
        .update({
          status: "completed",
          approved_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Try to send Telegram message (may fail for web users)
      try {
        await supabase.functions.invoke("send-telegram-message", {
          body: {
            telegram_user_id: request.telegram_user_id,
            message: `✅ আপনার WhatsApp নম্বর সফলভাবে অ্যাড হয়েছে!\n\n📱 নম্বর: ${request.phone_number}\n\n💰 ২৪ ঘন্টা পর ১৫ টাকা পাবেন।`,
          },
        });
      } catch (telegramError) {
        console.log("Telegram send skipped:", telegramError);
      }

      toast.success("নম্বর অ্যাপ্রুভ হয়েছে");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("অ্যাপ্রুভ করতে সমস্যা হয়েছে");
    }
  };

  const openRejectDialog = (request: NumberRequest) => {
    setRejectDialog({ open: true, request });
    setRejectReason("");
  };

  const rejectNumber = async () => {
    if (!rejectDialog.request) return;

    setRejecting(true);
    try {
      const { error: updateError } = await supabase
        .from("number_requests")
        .update({
          status: "cancelled",
          rejection_reason: rejectReason || "নম্বর রিজেক্ট করা হয়েছে",
        })
        .eq("id", rejectDialog.request.id);

      if (updateError) throw updateError;

      // Try to send Telegram message (may fail for web users)
      try {
        await supabase.functions.invoke("send-telegram-message", {
          body: {
            telegram_user_id: rejectDialog.request.telegram_user_id,
            message: `❌ আপনার নম্বর রিজেক্ট হয়েছে!\n\n📱 নম্বর: ${rejectDialog.request.phone_number}\n\n${rejectReason ? `📝 কারণ: ${rejectReason}\n\n` : ""}👉 নতুন নম্বর অ্যাড করুন।`,
          },
        });
      } catch (telegramError) {
        console.log("Telegram send skipped:", telegramError);
      }

      toast.success("নম্বর রিজেক্ট হয়েছে");
      setRejectDialog({ open: false, request: null });
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("রিজেক্ট করতে সমস্যা হয়েছে");
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-0"><Clock className="w-3 h-3 mr-1" />অপেক্ষমাণ</Badge>;
      case "code_sent":
        return <Badge className="bg-blue-500/20 text-blue-600 border-0"><Send className="w-3 h-3 mr-1" />কোড পাঠানো</Badge>;
      case "code_received":
        return <Badge className="bg-purple-500/20 text-purple-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />কোড জমা</Badge>;
      case "confirmed":
        return <Badge className="bg-cyan-500/20 text-cyan-600 border-0"><Star className="w-3 h-3 mr-1" />কনফার্মড</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" />সম্পন্ন</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-0"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return r.status === "pending";
    if (statusFilter === "active") return ["code_sent", "code_received", "confirmed"].includes(r.status);
    if (statusFilter === "completed") return r.status === "completed";
    if (statusFilter === "cancelled") return r.status === "cancelled";
    return true;
  });

  const stats = {
    pending: requests.filter(r => r.status === "pending").length,
    active: requests.filter(r => ["code_sent", "code_received", "confirmed"].includes(r.status)).length,
    completed: requests.filter(r => r.status === "completed").length,
    cancelled: requests.filter(r => r.status === "cancelled").length,
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">অপেক্ষমাণ</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            <p className="text-xs text-muted-foreground">প্রক্রিয়াধীন</p>
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
            <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">বাতিল</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">সব ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending">অপেক্ষমাণ</TabsTrigger>
              <TabsTrigger value="active">প্রক্রিয়াধীন</TabsTrigger>
              <TabsTrigger value="completed">সম্পন্ন</TabsTrigger>
              <TabsTrigger value="cancelled">বাতিল</TabsTrigger>
            </TabsList>
            <Button variant="outline" onClick={fetchRequests} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              রিফ্রেশ
            </Button>
          </div>
        </Tabs>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">কোন রিকোয়েস্ট নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                      📱 {request.phone_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      👤 {request.telegram_username || request.telegram_user_id}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.service_name && (
                    <p className="text-sm text-muted-foreground">
                      সেবা: <span className="text-foreground font-medium">{request.service_name}</span>
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    📅 সময়: {new Date(request.created_at).toLocaleString("bn-BD")}
                  </p>

                  {request.verification_code && (
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <p className="text-sm">
                        🔐 কোড: <span className="font-mono font-bold text-lg text-primary">{request.verification_code}</span>
                      </p>
                    </div>
                  )}

                  {/* Actions for pending/active requests */}
                  {["pending", "code_sent", "code_received", "confirmed"].includes(request.status) && (
                    <>
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex gap-2">
                          <Input
                            placeholder="ভেরিফিকেশন কোড"
                            value={codes[request.id] || ""}
                            onChange={(e) =>
                              setCodes((prev) => ({ ...prev, [request.id]: e.target.value }))
                            }
                            className="font-mono text-lg"
                          />
                          <Button
                            onClick={() => sendVerificationCode(request)}
                            disabled={sendingCode === request.id}
                            className="bg-gradient-to-r from-primary to-primary/80"
                          >
                            {sendingCode === request.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Textarea
                            placeholder="কোডের সাথে কাস্টম মেসেজ (ঐচ্ছিক)..."
                            value={messages[request.id] || ""}
                            onChange={(e) =>
                              setMessages((prev) => ({ ...prev, [request.id]: e.target.value }))
                            }
                            className="min-h-[80px] pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => approveNumber(request)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          অ্যাপ্রুভ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectDialog(request)}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          রিজেক্ট
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Reject button for completed requests */}
                  {request.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRejectDialog(request)}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      রিজেক্ট করুন
                    </Button>
                  )}

                  {request.rejection_reason && (
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <p className="text-sm text-red-600">
                        ❌ রিজেক্ট কারণ: {request.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, request: rejectDialog.request })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              নম্বর রিজেক্ট করুন
            </DialogTitle>
            <DialogDescription>
              এই নম্বর রিজেক্ট করার কারণ লিখুন। ইউজার এই মেসেজ দেখতে পাবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-xl">
              <Label className="text-xs text-muted-foreground">নম্বর</Label>
              <p className="font-mono text-lg font-bold">{rejectDialog.request?.phone_number}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">রিজেক্ট করার কারণ</Label>
              <Textarea
                id="reject-reason"
                placeholder="কারণ লিখুন..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null })}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={rejectNumber} disabled={rejecting}>
              {rejecting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              রিজেক্ট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};