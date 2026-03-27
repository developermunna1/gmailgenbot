
-- Update get_leaderboard function to rank by balance instead of total_earned
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(id uuid, telegram_username text, telegram_user_id text, total_earned numeric, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ub.id,
    ub.telegram_username,
    ub.telegram_user_id,
    ub.balance as total_earned,
    ROW_NUMBER() OVER (ORDER BY ub.balance DESC) as rank
  FROM public.user_balances ub
  ORDER BY ub.balance DESC
  LIMIT 100
$function$;
