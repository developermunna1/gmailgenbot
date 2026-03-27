-- Create table for telegram channels (for channel buttons)
CREATE TABLE public.telegram_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_username TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user balances
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_username TEXT,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  successful_numbers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for referral tracking
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_telegram_id TEXT NOT NULL,
  referred_telegram_id TEXT NOT NULL UNIQUE,
  is_completed BOOLEAN DEFAULT false,
  commission_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add new columns to number_requests for balance tracking
ALTER TABLE public.number_requests 
ADD COLUMN IF NOT EXISTS balance_credited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Enable RLS
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS for telegram_channels (public read, admin write)
CREATE POLICY "Anyone can view active channels" ON public.telegram_channels
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage channels" ON public.telegram_channels
FOR ALL USING (is_admin(auth.uid()));

-- RLS for user_balances
CREATE POLICY "Admins can view all balances" ON public.user_balances
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update balances" ON public.user_balances
FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert balance record" ON public.user_balances
FOR INSERT WITH CHECK (true);

-- RLS for referrals
CREATE POLICY "Admins can view all referrals" ON public.referrals
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert referrals" ON public.referrals
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON public.referrals
FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_telegram_channels_updated_at
BEFORE UPDATE ON public.telegram_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check and credit 24-hour active numbers
CREATE OR REPLACE FUNCTION public.credit_24hour_active_numbers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user balances for approved numbers that are 24+ hours old and not yet credited
  UPDATE public.user_balances ub
  SET 
    balance = balance + 10,
    total_earned = total_earned + 10,
    successful_numbers = successful_numbers + 1,
    updated_at = now()
  FROM public.number_requests nr
  WHERE nr.telegram_user_id = ub.telegram_user_id
    AND nr.status = 'completed'
    AND nr.approved_at IS NOT NULL
    AND nr.approved_at <= now() - interval '24 hours'
    AND nr.balance_credited = false;

  -- Mark those numbers as credited
  UPDATE public.number_requests
  SET balance_credited = true, updated_at = now()
  WHERE status = 'completed'
    AND approved_at IS NOT NULL
    AND approved_at <= now() - interval '24 hours'
    AND balance_credited = false;

  -- Check and complete referrals where referred user has 2+ successful numbers
  UPDATE public.referrals r
  SET is_completed = true, completed_at = now()
  FROM public.user_balances ub
  WHERE r.referred_telegram_id = ub.telegram_user_id
    AND ub.successful_numbers >= 2
    AND r.is_completed = false;

  -- Credit referral commission (20 taka)
  UPDATE public.user_balances ub
  SET 
    balance = balance + 20,
    total_earned = total_earned + 20,
    updated_at = now()
  FROM public.referrals r
  WHERE r.referrer_telegram_id = ub.telegram_user_id
    AND r.is_completed = true
    AND r.commission_paid = false;

  -- Mark commission as paid
  UPDATE public.referrals
  SET commission_paid = true
  WHERE is_completed = true AND commission_paid = false;
END;
$$;