'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Settings,
  MessageSquare,
  Database,
  Search,
  BarChart3,
  AlertTriangle
} from "lucide-react"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  // Handle authentication state with timeout fallback
  useEffect(() => {
    if (isLoaded) {
      setShowDashboard(true)
    } else {
      // Show dashboard after 3 seconds even if Clerk doesn't load
      const timeout = setTimeout(() => {
        setShowDashboard(true)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [isLoaded])

  // Show loading state
  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home, 
      description: "Overview and key metrics",
      current: true 
    },
    { 
      name: "Insights Center", 
      href: "/insights-center", 
      icon: CheckCircle, 
      description: "Analytics and insights management",
      current: false 
    },
    { 
      name: "Live Chat", 
      href: "/chat", 
      icon: Brain, 
      description: "AI assistant and real-time queries",
      current: false 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings, 
      description: "Account settings and logout",
      current: false 
    },
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
              <h1 className="text-xl font-bold text-gray-900">Smarthead</h1>
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
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    {!item.current && (
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {isLoaded ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">U</span>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'vv@agenticlabs.io'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hello, {(user?.firstName as string) || 'User'}</h1>
              <p className="text-gray-600">Welcome to your intelligent overhead cost insights tool</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Hello, {(user?.firstName as string) || 'there'}! 👋
                </h2>
                <p className="text-lg text-blue-100">
                  Ready to optimize your overhead costs with intelligent insights?
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Smart Insights</div>
                    <div className="text-sm text-gray-600">AI-powered recommendations</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Target className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Cost Optimization</div>
                    <div className="text-sm text-gray-600">Reduce overhead costs</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Zap className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Real-time Analytics</div>
                    <div className="text-sm text-gray-600">Live performance tracking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started Steps */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Getting Started - Follow These Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1: Product Demo */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-lg">Watch Product Demo</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    Start with our interactive product demo to see all features in action. 
                    Includes comprehensive user guide and best practices.
                  </CardDescription>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">
                      💡 Interactive walkthrough with real examples
                    </p>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/product-demo">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Demo & Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Step 2: Live Chat */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">2</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="h-6 w-6 text-green-600" />
                      <CardTitle className="text-lg">Start with Live Chat</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    Begin by asking natural language questions about your overhead cost data. 
                    The AI assistant provides real-time insights and can help you explore your data.
                  </CardDescription>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">
                      💡 Example: "Which facilities have the highest overhead costs this quarter?"
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/chat">
                      <Brain className="mr-2 h-4 w-4" />
                      Start Live Chat
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Step 3: Insights Center */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">3</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                      <CardTitle className="text-lg">Explore Insights Center</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    Review AI-generated insights about overhead cost savings, facility risk patterns, and optimization opportunities. 
                    Manage insights and explore analytics dashboards.
                  </CardDescription>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">
                      Find: Facility cost concentration risks, overhead optimization opportunities
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/insights-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      View Insights Center
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Quick Tips for Success</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Start with questions</div>
                      <div className="text-sm text-gray-600">Ask the AI Assistant about your biggest overhead cost concerns</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Review insights regularly</div>
                      <div className="text-sm text-gray-600">Check the Insights Center for new patterns and recommendations</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Be specific in queries</div>
                      <div className="text-sm text-gray-600">Include entity names, time periods, and cost categories for better results</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Use semantic search</div>
                      <div className="text-sm text-gray-600">Try queries like "Find similar to equipment investments"</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}