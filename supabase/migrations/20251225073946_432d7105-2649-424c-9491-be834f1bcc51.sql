-- Create app_settings table for admin control
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  setting_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete settings" 
ON public.app_settings 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_label) VALUES
('welcome_bonus', '20', 'স্বাগতম বোনাস (টাকা)'),
('referral_bonus', '20', 'রেফারেল বোনাস (টাকা)'),
('per_number_earning', '15', 'প্রতি নম্বর আয় (টাকা)'),
('min_withdrawal', '100', 'সর্বনিম্ন উইথড্র (টাকা)'),
('required_successful_numbers', '2', 'রেফারেল সম্পন্নের জন্য প্রয়োজনীয় সফল নম্বর');

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_name text,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
USING (true);

-- Anyone can insert withdrawal requests
CREATE POLICY "Anyone can insert withdrawal requests" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (true);

-- Only admins can update withdrawals
CREATE POLICY "Admins can update withdrawals" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Only admins can delete withdrawals
CREATE POLICY "Admins can delete withdrawals" 
ON public.withdrawal_requests 
FOR DELETE 
USING (is_admin(auth.uid()));