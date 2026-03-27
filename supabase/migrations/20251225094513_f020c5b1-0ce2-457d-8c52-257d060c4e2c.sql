-- Drop the conflicting update policy
DROP POLICY IF EXISTS "Users can update own balance via telegram_user_id" ON public.user_balances;

-- Create separate policies for admins and users
CREATE POLICY "Admins can update any balance" 
ON public.user_balances 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Users can only update their own non-sensitive fields (not balance directly)
-- Balance should only be updated by admin or system functions