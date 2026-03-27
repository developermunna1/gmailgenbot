-- Bot settings table
CREATE TABLE public.bot_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT,
  bot_username TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Number requests table
CREATE TABLE public.number_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  phone_number TEXT NOT NULL,
  service_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verification_code TEXT,
  code_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;

-- RLS Policies for bot_settings
CREATE POLICY "Admins can view bot settings" ON public.bot_settings
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert bot settings" ON public.bot_settings
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bot settings" ON public.bot_settings
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for number_requests
CREATE POLICY "Admins can view all requests" ON public.number_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert requests" ON public.number_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update requests" ON public.number_requests
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete requests" ON public.number_requests
  FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin users" ON public.admin_users
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Enable realtime for number_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.number_requests;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_number_requests_updated_at
  BEFORE UPDATE ON public.number_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();