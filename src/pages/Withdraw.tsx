import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft,
  Wallet,
  Plus,
  Trash2,
  Edit,
  CreditCard
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

interface SavedCard {
  id: string;
  name: string;
  number: string;
  type: 'bkash' | 'nagad';
}

interface AppSettings {
  min_withdrawal: number;
  withdrawal_fee: number;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardType, setNewCardType] = useState<'bkash' | 'nagad'>('bkash');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [cardFilter, setCardFilter] = useState<'all' | 'bkash' | 'nagad'>('all');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      // Load saved cards from localStorage
      const saved = localStorage.getItem(`cards_${session.user.id}`);
      if (saved) {
        setSavedCards(JSON.parse(saved));
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      const settings: AppSettings = {
        min_withdrawal: 100,
        withdrawal_fee: 10
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

  const balance = userBalance?.balance || 0;
  const minWithdraw = appSettings?.min_withdrawal || 100;
  const withdrawFee = appSettings?.withdrawal_fee || 10;

  // Preset amounts
  const presetAmounts = [
    { value: 268, actual: 244 },
    { value: 384, actual: 366 },
    { value: 640, actual: 610 },
  ];

  const calculateActual = (amount: number) => {
    const fee = (amount * withdrawFee) / 100;
    return Math.floor(amount - fee);
  };

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = selectedAmount || parseFloat(customAmount);
      
      if (!amount || amount < minWithdraw) {
        throw new Error(`সর্বনিম্ন ৳${minWithdraw} উইথড্র করতে হবে`);
      }
      
      if (amount > balance) {
        throw new Error("অপর্যাপ্ত ব্যালেন্স");
      }
      
      if (!selectedCard) {
        throw new Error("অ্যাকাউন্ট সিলেক্ট করুন");
      }

      // Insert withdrawal request
      const { error: withdrawError } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        user_name: selectedCard.name,
        amount: amount,
        payment_method: selectedCard.type,
        account_number: selectedCard.number,
        status: 'pending'
      });
      
      if (withdrawError) throw withdrawError;

      // Deduct balance from user
      const newBalance = balance - amount;
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('telegram_user_id', user.id);
      
      if (balanceError) throw balanceError;
    },
    onSuccess: () => {
      toast.success("উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!");
      queryClient.invalidateQueries({ queryKey: ['user-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || "উইথড্র রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে");
    }
  });

  const handleAddCard = () => {
    if (!newCardName || newCardNumber.length < 11) {
      toast.error("সঠিক তথ্য দিন");
      return;
    }
    const newCard: SavedCard = {
      id: Date.now().toString(),
      name: newCardName,
      number: newCardNumber,
      type: newCardType
    };
    const updatedCards = [...savedCards, newCard];
    setSavedCards(updatedCards);
    localStorage.setItem(`cards_${user.id}`, JSON.stringify(updatedCards));
    setNewCardName("");
    setNewCardNumber("");
    setIsAddingCard(false);
    toast.success("কার্ড যোগ হয়েছে!");
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = savedCards.filter(c => c.id !== cardId);
    setSavedCards(updatedCards);
    localStorage.setItem(`cards_${user.id}`, JSON.stringify(updatedCards));
    if (selectedCard?.id === cardId) {
      setSelectedCard(null);
    }
    toast.success("কার্ড মুছে ফেলা হয়েছে");
  };

  const withdrawAll = () => {
    setSelectedAmount(balance);
    setCustomAmount("");
  };

  const filteredCards = savedCards.filter(card => 
    cardFilter === 'all' || card.type === cardFilter
  );

  const maskNumber = (num: string) => {
    return `**** **** **** ${num.slice(-4)}`;
  };

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  const actualReceive = calculateActual(currentAmount);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Add Card Dialog */}
      <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              নতুন কার্ড যোগ করুন
            </DialogTitle>
            <DialogDescription>বিকাশ/নগদ অ্যাকাউন্ট যোগ করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>অ্যাকাউন্ট টাইপ</Label>
              <Select value={newCardType} onValueChange={(v: 'bkash' | 'nagad') => setNewCardType(v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">
                    <span className="text-pink-500 font-bold">bKash</span>
                  </SelectItem>
                  <SelectItem value="nagad">
                    <span className="text-orange-500 font-bold">Nagad</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>নাম</Label>
              <Input
                placeholder="Md Example Name"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>মোবাইল নম্বর</Label>
              <Input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-primary"
              onClick={handleAddCard}
            >
              যোগ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-primary p-4 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-primary-foreground flex-1 text-center pr-10">Withdraw</h1>
          </div>

          {/* Balance Card */}
          <Card className="bg-card border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Balance</span>
                <span className="text-xs text-muted-foreground">Daily withdrawal frequency: 2 times</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">৳{balance.toFixed(2)}</span>
                </div>
                <Button 
                  className="bg-primary text-primary-foreground rounded-lg px-4"
                  onClick={withdrawAll}
                >
                  Withdraw all
                </Button>
              </div>
              <p className="text-xs text-primary mt-2">Exceeding {minWithdraw}৳ Can withdraw all</p>
              <p className="text-xs text-muted-foreground">no extra handling fee, Credited Directly To DreamShare to your account</p>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 space-y-4">
          {/* Amount Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Actual amount received</span>
                <span className="text-2xl">৳</span>
              </div>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto"
                onClick={withdrawAll}
              >
                Withdraw all
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {presetAmounts.map((preset) => (
                <Card 
                  key={preset.value}
                  className={`cursor-pointer transition-all ${
                    selectedAmount === preset.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => { setSelectedAmount(preset.value); setCustomAmount(""); }}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-foreground">{preset.value}৳</p>
                    <p className="text-xs text-muted-foreground">Actually receive: {preset.actual}৳</p>
                  </CardContent>
                </Card>
              ))}
              <Card 
                className={`cursor-pointer transition-all ${
                  customAmount && !selectedAmount
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CardContent className="p-4">
                  <Input
                    type="number"
                    placeholder="Custom"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="h-8 text-center border-0 bg-transparent text-lg font-bold"
                  />
                  {customAmount && (
                    <p className="text-xs text-muted-foreground text-center">
                      Actually receive: {calculateActual(parseFloat(customAmount))}৳
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Saved Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Bank card information</span>
              <Select value={cardFilter} onValueChange={(v: 'all' | 'bkash' | 'nagad') => setCardFilter(v)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCards.map((card) => (
              <Card 
                key={card.id}
                className={`cursor-pointer transition-all ${
                  selectedCard?.id === card.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedCard(card)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{card.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{maskNumber(card.number)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        card.type === 'bkash' 
                          ? 'bg-pink-100 text-pink-600' 
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {card.type.toUpperCase()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card 
              className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setIsAddingCard(true)}
            >
              <CardContent className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Plus className="w-5 h-5" />
                <span>Add new card</span>
              </CardContent>
            </Card>
          </div>

          {/* Withdraw Button */}
          <Button 
            className="w-full h-14 rounded-xl text-lg font-bold bg-primary"
            disabled={withdrawMutation.isPending || !currentAmount || currentAmount < minWithdraw || !selectedCard}
            onClick={() => withdrawMutation.mutate()}
          >
            {withdrawMutation.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
