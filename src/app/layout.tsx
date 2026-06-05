import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/SessionProvider"
import { authOptions } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NEXUS AI - Discord Verified",
  description: "AI-powered neural workspace with Discord role verification",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dynamic import to handle version differences
  const { getServerSession } = await import("next-auth/next")
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className={`${inter.className} bg-surface-black text-white min-h-screen`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}