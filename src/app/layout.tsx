import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/SessionProvider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "E Private AI",
  description: "Free AI Tools made for whitelisted users. Website made with Kiwi AI.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className={`${inter.className} bg-discord-darkest text-white min-h-screen`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
