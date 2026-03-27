-- Allow everyone to view user_balances for leaderboard (only username and earnings, not sensitive data)
CREATE POLICY "Anyone can view user balances for leaderboard" 
ON public.user_balances 
FOR SELECT 
USING (true);

-- Allow users to update their own balance (for welcome bonus claim)
CREATE POLICY "Users can update own balance via telegram_user_id" 
ON public.user_balances 
FOR UPDATE 
USING (true);

-- Drop the admin-only select policy since we need public access for leaderboard
DROP POLICY IF EXISTS "Admins can view all balances" ON public.user_balances;