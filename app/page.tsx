"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Brain, Shield, TrendingUp, Zap, CheckCircle } from "lucide-react"
import Link from "next/link"
import { UserButton, useUser, SignInButton } from "@clerk/nextjs"

// Mock dashboard data based on product overview
const dashboardMetrics = {
  totalSpend: "$52.3M",
  suppliers: "1,247",
  facilities: "4",
  costCenters: "12",
  pendingInsights: 3,
  approvedInsights: 6,
  riskLevel: "Medium",
  savingsOpportunity: "$2.1M",
}

const recentInsights = [
  {
    title: "Supplier Concentration Risk",
    description: "Top 10 suppliers control 51.7% of spend ($13.2M)",
    priority: "High",
    status: "pending",
    impact: "$3.94M at risk",
  },
  {
    title: "Professional Services Consolidation",
    description: "47 suppliers can be consolidated to 20 for $890K savings",
    priority: "High",
    status: "approved",
    impact: "$890K savings",
  },
  {
    title: "Geographic Concentration Risk",
    description: "67.3% suppliers in Southeast region creates vulnerability",
    priority: "Medium",
    status: "approved",
    impact: "$8.95M at risk",
  },
]

const facilityMetrics = [
  { name: "Manufacturing Hub Alpha", spend: "$30.3M", percentage: 58 },
  { name: "Distribution Center Beta", spend: "$12.1M", percentage: 23 },
  { name: "Innovation Campus Gamma", spend: "$9.9M", percentage: 19 },
]

export default function HomePage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      router.push('/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FinSight...</p>
        </div>
      </div>
    )
  }

  // Show loading for authenticated users while redirecting
  if (isSignedIn && isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-12">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">FinSight</h1>
              </div>
              <div className="hidden lg:flex items-center space-x-8">
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                  Solutions
                </Link>
                <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Features
                </Link>
                <Link href="#benefits" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Benefits
                </Link>
                {isSignedIn && (
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <>
                  <span className="text-sm text-gray-600 hidden md:block font-medium">
                    {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                  </span>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm" className="font-medium">
                      Sign In
                    </Button>
                  </SignInButton>
                  <Link href="/sign-up">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-medium">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="mb-8">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                Intelligent Overhead Insights
              </Badge>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Smart Overhead Cost
              <span className="text-blue-600 block">Management Tool</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Streamline your facility overhead costs with intelligent insights, 
              predictive analytics, and smart cost optimization powered by AI.
            </p>
            <div className="flex flex-col items-center justify-center mb-16">
              {isSignedIn ? (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto">
                  <Link href="/dashboard">
                    <Brain className="mr-3 h-6 w-6" />
                    Access Dashboard
                  </Link>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto font-medium">
                    Get Started
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium mb-6">
              Platform Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Complete Overhead Cost Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to optimize your facility overhead costs, reduce expenses, 
              and gain intelligent insights with AI-powered analytics.
            </p>
          </div>

          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Ask natural language questions about your overhead costs and get intelligent insights instantly
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Smart Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Automated detection of cost savings opportunities and risk patterns with actionable recommendations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="mx-auto w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-10 w-10 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Data Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Comprehensive overhead cost analysis and facility performance monitoring with real-time dashboards
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="h-10 w-10 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Real-time facility risk monitoring and overhead cost concentration analysis with early warnings
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="bg-green-100 text-green-800 border-green-200 font-medium mb-6">
              Proven Results
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Choose FinSight?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience intelligent overhead cost optimization with measurable results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mb-8">
                <TrendingUp className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cost Reduction</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Average 15% reduction in overhead costs through AI-driven optimization
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <Zap className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Time Savings</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Reduce manual analysis time by 80% with automated insights and reporting
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center mb-8">
                <Shield className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Risk Mitigation</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Proactive risk identification and facility cost optimization recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <Card className="max-w-4xl mx-auto p-8">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">
                Ready to Optimize Your Overhead Costs?
              </CardTitle>
              <CardDescription className="text-lg">
                Start optimizing your overhead costs with intelligent insights and AI-powered analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                {isSignedIn ? (
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      <Brain className="mr-2 h-5 w-5" />
                      Access Your Dashboard
                    </Link>
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button size="lg">
                      Get Started
                    </Button>
                  </SignInButton>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}