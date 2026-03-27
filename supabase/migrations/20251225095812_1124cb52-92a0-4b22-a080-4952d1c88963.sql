-- Fix user_notifications: Only allow users to view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (user_id = auth.uid()::text OR is_admin(auth.uid()));

-- Fix user_notifications UPDATE policy
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications" 
ON public.user_notifications 
FOR UPDATE 
USING (user_id = auth.uid()::text);

-- Fix withdrawal_requests: Only allow users to view their own withdrawals or admins
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
USING (user_id = auth.uid()::text OR is_admin(auth.uid()));