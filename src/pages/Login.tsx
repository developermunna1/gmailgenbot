import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, Loader2, Sparkles, Gift, ArrowLeft } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    phone: "",
    name: "",
    referralCode: ""
  });

  // Get referral code from URL or let user input
  const urlReferralCode = searchParams.get('ref');

  useEffect(() => {
    if (urlReferralCode) {
      setSignupData(prev => ({ ...prev, referralCode: urlReferralCode }));
    }
  }, [urlReferralCode]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      toast.error("লগইন ব্যর্থ: " + error.message);
    } else {
      toast.success("সফলভাবে লগইন হয়েছে!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না!");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          phone: signupData.phone,
          name: signupData.name,
        }
      }
    });

    if (error) {
      toast.error("রেজিস্ট্রেশন ব্যর্থ: " + error.message);
    } else if (authData.user) {
      // Use referral code from form (which may be from URL or manually entered)
      const refCode = signupData.referralCode.trim().toUpperCase();
      const userRefCode = `REF${authData.user.id.substring(0, 8).toUpperCase()}`;
      
      let referrerFound = false;
      
      if (refCode) {
        // Find referrer by referral code
        const { data: referrer } = await supabase
          .from('user_balances')
          .select('telegram_user_id')
          .eq('referral_code', refCode)
          .maybeSingle();

        if (referrer) {
          referrerFound = true;
          
          // Create referral record
          await supabase.from('referrals').insert({
            referrer_telegram_id: referrer.telegram_user_id,
            referred_telegram_id: authData.user.id,
            is_completed: false,
            commission_paid: false
          });

          // Create user balance with referred_by
          await supabase.from('user_balances').insert({
            telegram_user_id: authData.user.id,
            telegram_username: signupData.name || signupData.email,
            referral_code: userRefCode,
            referred_by: refCode,
            balance: 0,
            total_earned: 0,
            successful_numbers: 0,
            welcome_bonus_claimed: false
          });
          
          toast.success("🎉 রেফারেল কোড সফলভাবে ব্যবহৃত হয়েছে!");
        } else {
          toast.error("রেফারেল কোড সঠিক নয়");
        }
      }
      
      // If no referral code or referrer not found, still create user balance
      if (!referrerFound) {
        await supabase.from('user_balances').insert({
          telegram_user_id: authData.user.id,
          telegram_username: signupData.name || signupData.email,
          referral_code: userRefCode,
          balance: 0,
          total_earned: 0,
          successful_numbers: 0,
          welcome_bonus_claimed: false
        });
      }
      
      toast.success("সফলভাবে রেজিস্ট্রেশন হয়েছে!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30 animate-pulse">
            <Send className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">𝗧𝗮𝗽 𝗟𝗶𝗻𝗸</h1>
          <p className="text-muted-foreground text-sm mt-1">নম্বর ভাড়া দিয়ে আয় করুন</p>
        </div>

        {/* Bonus Badge */}
        <div className="mb-4 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full flex items-center gap-2 animate-bounce">
          <Gift className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-600">স্বাগতম বোনাস ৳২০!</span>
        </div>

        {/* Form Card */}
        <Card className="w-full border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="rounded-xl">লগইন</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl">রেজিস্ট্রেশন</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">ইমেইল</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">পাসওয়ার্ড</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-base bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    লগইন করুন
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">নাম</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="আপনার নাম"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">মোবাইল নম্বর</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">ইমেইল</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">পাসওয়ার্ড</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">পাসওয়ার্ড নিশ্চিত করুন</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="আবার পাসওয়ার্ড দিন"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral" className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      রেফারেল কোড (ঐচ্ছিক)
                    </Label>
                    <Input
                      id="signup-referral"
                      type="text"
                      placeholder="যেমন: REF12345678"
                      value={signupData.referralCode}
                      onChange={(e) => setSignupData({ ...signupData, referralCode: e.target.value.toUpperCase() })}
                      className="h-12 rounded-xl border-green-500/30 focus:border-green-500"
                    />
                    {signupData.referralCode && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        রেফারেল কোড ব্যবহার করা হবে
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-base bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    রেজিস্ট্রেশন করুন
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          রেজিস্ট্রেশন করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন
        </p>
      </div>
    </div>
  );
};

export default Login;