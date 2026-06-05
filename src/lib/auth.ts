import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.id = (profile as any).id
        token.image = (profile as any).avatar
          ? `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).avatar}.png`
          : null
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.image = token.image as string
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
})