import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

// For App Router, we need to handle the request properly
// Using the pattern from official NextAuth docs for advanced initialization
async function authHandler(req: NextRequest) {
  // @ts-ignore - NextAuth v4 type mismatch with Next.js 14 App Router
  return await NextAuth(req as any, {} as any, authOptions)
}

export async function GET(req: NextRequest) {
  const res = await authHandler(req)
  return res as NextResponse
}

export async function POST(req: NextRequest) {
  const res = await authHandler(req)
  return res as NextResponse
}