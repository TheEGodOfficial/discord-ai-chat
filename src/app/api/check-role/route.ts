import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ hasRole: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Fetch user's guilds to find the specific server
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!guildsRes.ok) {
      return NextResponse.json({ hasRole: false, error: "Failed to fetch guilds" }, { status: 500 });
    }

    const guilds = await guildsRes.json();
    const targetGuild = guilds.find((g: any) => g.id === process.env.DISCORD_GUILD_ID);

    if (!targetGuild) {
      return NextResponse.json({ hasRole: false, error: "Not in server" });
    }

    // Use bot token to check member roles (more reliable than user token)
    const botRes = await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${session.user.id}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!botRes.ok) {
      // Fallback: check if user has the role via guilds endpoint (less reliable)
      // This only works if the role is included in the guild object (rare)
      return NextResponse.json({ 
        hasRole: false, 
        error: "Bot cannot access member. Ensure bot is in server with proper permissions." 
      });
    }

    const member = await botRes.json();
    const hasRole = member.roles?.includes(process.env.DISCORD_REQUIRED_ROLE_ID);

    return NextResponse.json({ hasRole: !!hasRole, roles: member.roles });
  } catch (error) {
    console.error("Role check error:", error);
    return NextResponse.json({ hasRole: false, error: "Server error" }, { status: 500 });
  }
}