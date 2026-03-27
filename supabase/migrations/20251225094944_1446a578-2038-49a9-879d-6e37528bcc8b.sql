-- Allow users to update their own balance (for withdrawal deduction)
CREATE POLICY "Users can update own balance for withdrawal" 
ON public.user_balances 
FOR UPDATE 
USING (telegram_user_id = auth.uid()::text);