"use client"
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode, useEffect, useState } from "react"

export function SessionProvider({ children, session }: { children: ReactNode; session?: any }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until client mount
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
}
