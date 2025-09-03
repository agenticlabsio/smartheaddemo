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
            <h1 className="text-2xl font-bold text-primary">SpendSmart</h1>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-foreground hover:text-primary font-medium">
                Home
              </Link>
              <Link href="/ai-assistant" className="text-muted-foreground hover:text-primary">
                AI Assistant
              </Link>
              <Link href="/insights-approval" className="text-muted-foreground hover:text-primary">
                Insights Approval
              </Link>
              <Link href="/data-catalog" className="text-muted-foreground hover:text-primary">
                Data Catalog
              </Link>
              <Link href="/settings" className="text-muted-foreground hover:text-primary">
                Settings
              </Link>
            </div>
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
