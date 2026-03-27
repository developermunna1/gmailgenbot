-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view user balances for leaderboard" ON public.user_balances;

-- Create policy for users to view only their own balance
CREATE POLICY "Users can view own balance" 
ON public.user_balances 
FOR SELECT 
USING (telegram_user_id = auth.uid()::text);

-- Create policy for admins to view all balances
CREATE POLICY "Admins can view all balances" 
ON public.user_balances 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create a secure function for leaderboard that only returns safe data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  telegram_username text,
  telegram_user_id text,
  total_earned numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ub.id,
    ub.telegram_username,
    ub.telegram_user_id,
    ub.total_earned,
    ROW_NUMBER() OVER (ORDER BY ub.total_earned DESC) as rank
  FROM public.user_balances ub
  ORDER BY ub.total_earned DESC
  LIMIT 100
$$;