import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: number
  features: string[]
}

interface DiscordMember {
  user?: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
  }
  nick: string | null
  avatar: string | null
  roles: string[]
  joined_at: string
  premium_since: string | null
  deaf: boolean
  mute: boolean
  flags: number
  pending: boolean
  permissions: number
  communication_disabled_until: string | null
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ hasRole: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!guildsRes.ok) {
      return NextResponse.json({ hasRole: false, error: "Failed to fetch guilds" }, { status: 500 })
    }

    const guilds: DiscordGuild[] = await guildsRes.json()
    const targetGuild = guilds.find((g) => g.id === process.env.DISCORD_GUILD_ID)

    if (!targetGuild) {
      return NextResponse.json({ hasRole: false, error: "Not in server" })
    }

    const botRes = await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${session.user.id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    )

    if (!botRes.ok) {
      const botError = await botRes.text()
      return NextResponse.json({
        hasRole: false,
        error: "Bot API failed",
        botStatus: botRes.status,
        botError: botError,
        userId: session.user.id,
        guildId: process.env.DISCORD_GUILD_ID,
      })
    }

    const member: DiscordMember = await botRes.json()
    const hasRole = member.roles?.includes(process.env.DISCORD_REQUIRED_ROLE_ID)

    return NextResponse.json({
      hasRole: !!hasRole,
      roles: member.roles,
      checkedRole: process.env.DISCORD_REQUIRED_ROLE_ID,
    })
  } catch (error: any) {
    return NextResponse.json({ hasRole: false, error: "Server error", details: error.message }, { status: 500 })
  }
}
