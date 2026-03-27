-- Create support_channels table for multiple Telegram support channels/groups
CREATE TABLE public.support_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'channel', -- 'channel' or 'group'
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_channels ENABLE ROW LEVEL SECURITY;

-- Policies for support_channels
CREATE POLICY "Anyone can view active support channels"
ON public.support_channels
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage support channels"
ON public.support_channels
FOR ALL
USING (is_admin(auth.uid()));

-- Create user_notifications table for custom admin notifications
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete notifications"
ON public.user_notifications
FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (true);