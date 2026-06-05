import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

// Helper function that works with both import styles
async function getSession() {
  try {
    const { getServerSession } = await import("next-auth/next")
    return await getServerSession(authOptions)
  } catch {
    const { getServerSession } = await import("next-auth")
    return await getServerSession(authOptions)
  }
}

export async function GET() {
  const session = await getSession()

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

    const guilds = await guildsRes.json()
    const targetGuild = guilds.find((g: any) => g.id === process.env.DISCORD_GUILD_ID)

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
      return NextResponse.json({
        hasRole: false,
        error: "Bot cannot access member. Ensure bot is in server with proper permissions.",
      })
    }

    const member = await botRes.json()
    const hasRole = member.roles?.includes(process.env.DISCORD_REQUIRED_ROLE_ID)

    return NextResponse.json({ hasRole: !!hasRole, roles: member.roles })
  } catch (error) {
    console.error("Role check error:", error)
    return NextResponse.json({ hasRole: false, error: "Server error" }, { status: 500 })
  }
}