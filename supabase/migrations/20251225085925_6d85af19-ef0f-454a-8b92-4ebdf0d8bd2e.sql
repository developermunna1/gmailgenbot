-- Update the credit function to give 15 taka per number per 24 hours
-- and 20 taka referral bonus when referred user has 2 successful numbers
CREATE OR REPLACE FUNCTION public.credit_24hour_active_numbers()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update user balances for approved numbers that are 24+ hours old and not yet credited
  -- Changed from 10 taka to 15 taka per number
  UPDATE public.user_balances ub
  SET 
    balance = balance + 15,
    total_earned = total_earned + 15,
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

  -- Credit referral commission (20 taka) - unchanged
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
$function$;