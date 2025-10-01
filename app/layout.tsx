import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { QueryProvider } from "@/components/providers/query-provider"
import { PerformanceProvider } from "@/components/providers/performance-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", 
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "FinSight - Intelligent Financial Transaction Analysis",
  description: "Smart financial transaction analysis tool with intelligent insights and analytics",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={`${inter.variable} font-inter antialiased`}>
          <QueryProvider>
            <PerformanceProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </PerformanceProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
