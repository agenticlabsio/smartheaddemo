'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import { NoSSR } from "@/components/ui/no-ssr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Optimized icon imports - only import what we actually use
import { 
  Brain, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  FileText,
  Settings,
  MessageSquare,
  Archive
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
  special?: boolean
}

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const { user } = useUser()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigationItems: NavigationItem[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home, 
      description: "Overview and key metrics"
    },
    { 
      name: "Insights Center", 
      href: "/insights-center", 
      icon: CheckCircle, 
      description: "Analytics and insights management"
    },
    { 
      name: "LiveAgent Chat", 
      href: "/chat", 
      icon: MessageSquare, 
      description: "AI assistant and real-time queries"
    },
    { 
      name: "Saved Queries", 
      href: "/saved-queries", 
      icon: Archive, 
      description: "Chat history and saved conversations"
    },
    { 
      name: "Data Explorer", 
      href: "/data", 
      icon: FileText, 
      description: "Explore and analyze datasets with advanced filtering"
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings, 
      description: "Account settings and logout"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collapsible Sidebar */}
      <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">LiveAgent</h1>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : item.special
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    {!isActive && (
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <NoSSR fallback={<div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />}>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonAvatarBox: "w-10 h-10"
                    }
                  }}
                />
              </NoSSR>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {(user?.firstName as string) || 'User'} {(user?.lastName as string) || ''}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {(user?.primaryEmailAddress?.emailAddress as string) || 'user@company.com'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.href === pathname)?.name || 'LiveAgent'}
              </h1>
              <p className="text-gray-600">LiveAgent - Advanced financial transaction analysis platform</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}