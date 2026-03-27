import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, ChevronRight, Wallet, Gift, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    // Reset tap count after 3 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 3000);

    // Navigate to admin after 10 taps
    if (newCount >= 10) {
      setTapCount(0);
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={handleLogoTap}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">𝗧𝗮𝗽 𝗟𝗶𝗻𝗸</span>
          </div>
          {/* Hidden admin button - access via 10 taps on logo */}
          <div className="w-10" />
        </header>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
          {/* Logo Animation */}
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <Wallet className="w-14 h-14 text-primary-foreground" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-xs font-bold">৳</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            নম্বর দিন, টাকা নিন!
          </h1>
          <p className="text-muted-foreground mb-8 max-w-xs">
            আপনার মোবাইল নম্বর দিয়ে সহজেই টাকা উপার্জন করুন। রেফার করে আরও বোনাস পান!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full mb-8">
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-xl font-bold text-foreground">৳১৫</p>
                <p className="text-[10px] text-muted-foreground">প্রতি নম্বর</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Gift className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-xl font-bold text-foreground">৳২০</p>
                <p className="text-[10px] text-muted-foreground">রেফারেল</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                <p className="text-xl font-bold text-foreground">১০০০+</p>
                <p className="text-[10px] text-muted-foreground">ইউজার</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <Link to={isLoggedIn ? "/dashboard" : "/login"} className="w-full">
            <Button size="lg" className="w-full h-14 rounded-2xl text-lg gap-2 shadow-lg shadow-primary/30">
              {isLoggedIn ? "ড্যাশবোর্ডে যান" : "এখনই শুরু করুন"}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>

          {!isLoggedIn && (
            <Link to="/login" className="mt-4">
              <Button variant="ghost" className="text-muted-foreground">
                ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
              </Button>
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="px-6 pb-8 space-y-3">
          {[
            { icon: Zap, title: "দ্রুত পেমেন্ট", desc: "২৪ঘন্টায় স্বয়ংক্রিয় ব্যালেন্স", color: "text-amber-500" },
            { icon: Shield, title: "সম্পূর্ণ নিরাপদ", desc: "আপনার তথ্য সুরক্ষিত", color: "text-green-600" },
            { icon: Gift, title: "রেফারেল বোনাস", desc: "বন্ধুদের আনুন, ৳২০ পান", color: "text-blue-500" },
          ].map((item, i) => (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            © ২০২৫ 𝗧𝗮𝗽 𝗟𝗶𝗻𝗸। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
