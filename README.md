# E Private AI

A Next.js application with Discord OAuth authentication, role verification, and AI-powered chat, image generation, and video generation using Puter.js.

## Features

- **Discord OAuth 2.0** - Login with Discord
- **Role Verification** - Checks if user has a specific role in your Discord server
- **AI Chat** - 30+ models including GPT-5.4, Claude, Gemini, DeepSeek, Grok, and more
- **Text to Image** - Generate images using GPT Image 2, DALL-E 3, Gemini Flash Image, DreamShaper, and more
- **Text to Video** - Generate video clips using Wan 2.7 and Sora
- **Streaming Responses** - Real-time streaming for chat responses
- **Dark Theme** - Discord-inspired dark UI

## Setup

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to OAuth2 → General:
   - Add redirect: `http://localhost:3000/api/auth/callback/discord` (dev)
   - Add redirect: `https://yourdomain.com/api/auth/callback/discord` (production)
4. Copy Client ID and Client Secret

### 2. Create a Discord Bot (for role checking)

1. In your Discord app, go to Bot section
2. Click "Add Bot" and copy the Bot Token
3. Invite the bot to your server with these permissions:
   - `Read Messages/View Channels`
   - `Read Message History`
   - `Manage Roles` (optional, for advanced features)

### 3. Get IDs

Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
- Right-click your server → Copy Server ID (Guild ID)
- Right-click the role → Copy Role ID

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update `NEXTAUTH_URL` to your production domain
5. Update Discord OAuth redirect URLs

## Puter.js

This app uses [Puter.js](https://puter.com) for AI capabilities. Puter.js provides free access to major AI models. The library is loaded via CDN in the layout.

## Architecture

- `src/app/page.tsx` - Main page with tab navigation (Chat/Image/Video)
- `src/components/ChatInterface.tsx` - AI chat with streaming
- `src/components/ImageGenerator.tsx` - Text-to-image generation
- `src/components/VideoGenerator.tsx` - Text-to-video generation
- `src/components/ModelSelector.tsx` - Reusable model dropdown
- `src/app/api/check-role/route.ts` - Discord role verification API
- `src/lib/auth.ts` - NextAuth configuration with Discord provider

## License

MIT