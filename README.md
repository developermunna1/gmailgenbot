# Gmail Bot Generator

A Telegram bot for generating `edu.pl` temporary emails with an Admin Dashboard.

## Features
- Generate `edu.pl` Gmails instantly via Telegram.
- Check OTP/Codes directly in the bot.
- Admin Dashboard for managing all requests.
- Securely stored in Supabase.

## setup
1. Clone the repository.
2. Install dependencies: `npm install` and `cd bot-server && npm install`.
3. Set up your `.env` files in both root and `bot-server`.
4. Deploy to Render.

## Deployment on Render
1. Connect your GitHub repository to Render.
2. Select "Web Service".
3. Use the following settings:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. Add environment variables:
   - `BOT_TOKEN`
   - `ADMIN_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
