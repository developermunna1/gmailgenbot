-- Create gmail_requests table
CREATE TABLE IF NOT EXISTS public.gmail_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    otp_code TEXT,
    domain TEXT DEFAULT 'edu.pl',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_requests ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all requests
CREATE POLICY "Admins can view all gmail requests" ON public.gmail_requests
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Allow service role/backend to insert/update
-- (Normally you'd use a service role key from the backend)
CREATE POLICY "Enable insert for authenticated users" ON public.gmail_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.gmail_requests
    FOR UPDATE USING (true);
