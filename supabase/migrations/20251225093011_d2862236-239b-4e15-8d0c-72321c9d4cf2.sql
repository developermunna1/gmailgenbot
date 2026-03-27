-- Allow authenticated users to view their own number requests
CREATE POLICY "Users can view own number requests" 
ON public.number_requests 
FOR SELECT 
USING (telegram_user_id = auth.uid()::text);

-- Ensure insert policy works for authenticated users (update existing)
DROP POLICY IF EXISTS "Anyone can insert requests" ON public.number_requests;
CREATE POLICY "Authenticated users can insert requests" 
ON public.number_requests 
FOR INSERT 
WITH CHECK (telegram_user_id = auth.uid()::text);

-- Allow users to update their own requests (for verification code submission)
CREATE POLICY "Users can update own requests" 
ON public.number_requests 
FOR UPDATE 
USING (telegram_user_id = auth.uid()::text);