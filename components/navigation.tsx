"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"

export function Navigation() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
              ProcureIQ
            </Link>
            <SignedIn>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-foreground hover:text-primary font-medium">
                  Dashboard
                </Link>
                <Link href="/insights-approval" className="text-muted-foreground hover:text-primary">
                  Insights Approval
                </Link>
                <Link href="/ai-assistant" className="text-muted-foreground hover:text-primary">
                  AI Assistant
                </Link>
                <Link href="/live-chat" className="text-muted-foreground hover:text-primary">
                  Live Chat
                </Link>
                <Link href="/data-catalog" className="text-muted-foreground hover:text-primary">
                  Data Catalog
                </Link>
                <Link href="/settings" className="text-muted-foreground hover:text-primary">
                  Settings
                </Link>
              </div>
            </SignedIn>
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  )
}
