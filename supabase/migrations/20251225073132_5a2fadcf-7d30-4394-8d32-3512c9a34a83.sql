-- Add welcome_bonus_claimed column to user_balances
ALTER TABLE public.user_balances 
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed boolean DEFAULT false;

-- Add status column options (code_received for user confirmation)
-- The status flow will be: pending -> code_sent -> code_received -> completed or cancelled