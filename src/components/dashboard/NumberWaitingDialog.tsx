import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, MessageSquare, Phone, Copy } from "lucide-react";
import { toast } from "sonner";

interface NumberRequest {
  id: string;
  phone_number: string;
  status: string;
  verification_code: string | null;
  admin_message?: string;
}

interface NumberWaitingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: NumberRequest | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const NumberWaitingDialog = ({
  open,
  onOpenChange,
  request,
  onConfirm,
  isSubmitting
}: NumberWaitingDialogProps) => {
  const [liveRequest, setLiveRequest] = useState<NumberRequest | null>(request);

  // Update local state when prop changes
  useEffect(() => {
    setLiveRequest(request);
  }, [request]);

  // Subscribe to realtime updates for this request
  useEffect(() => {
    if (!request?.id || !open) return;

    const channel = supabase
      .channel(`request-${request.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'number_requests',
          filter: `id=eq.${request.id}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          setLiveRequest(payload.new as NumberRequest);
          
          // Show toast when code arrives
          if (payload.new.status === 'code_sent' && payload.old.status !== 'code_sent') {
            toast.success("🔐 ভেরিফিকেশন কোড এসেছে!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request?.id, open]);

  const copyVerificationCode = () => {
    if (liveRequest?.verification_code) {
      navigator.clipboard.writeText(liveRequest.verification_code);
      toast.success("কোড কপি হয়েছে!");
    }
  };

  const getStatusContent = () => {
    if (!liveRequest) return null;

    switch (liveRequest.status) {
      case 'pending':
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
            <div>
              <Badge className="bg-amber-500/20 text-amber-600 border-0 mb-2">
                <Clock className="w-3 h-3 mr-1" />
                অপেক্ষমাণ
              </Badge>
              <p className="text-lg font-semibold text-foreground">অপেক্ষা করুন...</p>
              <p className="text-sm text-muted-foreground mt-1">
                অ্যাডমিন আপনাকে ভেরিফিকেশন কোড পাঠাবে
              </p>
            </div>
          </div>
        );

      case 'code_sent':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-green-500" />
              </div>
              <Badge className="bg-green-500/20 text-green-600 border-0 mb-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                নোটিফিকেশন এসেছে!
              </Badge>
            </div>

            {/* WhatsApp notification message */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                📱 আপনার হোয়াটসঅ্যাপে একটি নোটিফিকেশন গিয়েছে।
              </p>
              <p className="text-sm text-foreground text-center font-medium">
                সেখানে চাপ দিয়ে কনফার্ম করে নিচের নম্বরটি টাইপ করুন:
              </p>
            </div>

            {/* Verification code with copy button */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1 text-center">ভেরিফাই নম্বর:</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-mono font-bold text-primary tracking-widest">
                  {liveRequest.verification_code || '------'}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyVerificationCode}
                  className="h-10 w-10 rounded-full hover:bg-primary/10"
                >
                  <Copy className="w-5 h-5 text-primary" />
                </Button>
              </div>
            </div>

            {/* Show admin message if any */}
            {liveRequest.admin_message && (
              <div className="p-3 bg-muted rounded-xl">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{liveRequest.admin_message}</p>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <Button 
              onClick={onConfirm}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              আমি ভেরিফিকেশন নম্বরটি কনফার্ম করেছি
            </Button>
          </div>
        );

      case 'code_received':
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-purple-500" />
            </div>
            <div>
              <Badge className="bg-purple-500/20 text-purple-600 border-0 mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                কনফার্ম হয়েছে
              </Badge>
              <p className="text-lg font-semibold text-foreground">ধন্যবাদ!</p>
              <p className="text-sm text-muted-foreground mt-1">
                অ্যাডমিন যাচাই করছে, অপেক্ষা করুন...
              </p>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <Badge className="bg-green-500/20 text-green-600 border-0 mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                সম্পন্ন
              </Badge>
              <p className="text-lg font-semibold text-foreground">অভিনন্দন! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                আপনার নম্বর সফলভাবে যোগ হয়েছে!
              </p>
              <p className="text-sm text-primary mt-2 font-medium">
                ২৪ ঘন্টা পর ১৫ টাকা পাবেন
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl">
              বন্ধ করুন
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            {liveRequest?.phone_number || 'নম্বর'}
          </DialogTitle>
          <DialogDescription>নম্বর স্ট্যাটাস</DialogDescription>
        </DialogHeader>
        {getStatusContent()}
      </DialogContent>
    </Dialog>
  );
};