"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

// Mock dashboard data for instructional purposes
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

const quickStartSteps = [
  {
    step: 1,
    title: "Start with Insights Approval",
    description:
      "Review AI-generated insights about your procurement data. This is where you'll validate and approve recommendations.",
    action: "Review Pending Insights",
    href: "/insights-approval",
    icon: CheckCircle,
    status: "recommended",
  },
  {
    step: 2,
    title: "Explore with AI Assistant",
    description:
      "Ask natural language questions about your data. Try asking about spend patterns, supplier performance, or risk factors.",
    action: "Ask AI Assistant",
    href: "/ai-assistant",
    icon: Brain,
    status: "next",
  },
  {
    step: 3,
    title: "Browse Data Catalog",
    description:
      "Understand your data sources and their relationships. This helps you know what questions to ask the AI.",
    action: "Explore Data Sources",
    href: "/data-catalog",
    icon: BarChart3,
    status: "upcoming",
  },
  {
    step: 4,
    title: "Configure Settings",
    description: "Customize your dashboard preferences, notification settings, and user access controls.",
    action: "Manage Settings",
    href: "/settings",
    icon: Shield,
    status: "upcoming",
  },
]

const platformFeatures = [
  {
    title: "AI-Powered Insights",
    description: "Get intelligent recommendations about supplier consolidation, risk management, and cost optimization",
    usage: "Review insights daily to stay on top of opportunities and risks",
    icon: Brain,
    color: "bg-blue-500",
  },
  {
    title: "Real-time Analytics",
    description: "Monitor spend patterns, supplier performance, and compliance metrics in real-time",
    usage: "Use dashboards to track KPIs and identify trends",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    title: "Risk Management",
    description: "Proactive monitoring of supplier concentration, geographic risks, and compliance issues",
    usage: "Set up alerts for risk thresholds and review weekly reports",
    icon: Shield,
    color: "bg-red-500",
  },
  {
    title: "Cost Optimization",
    description: "Identify savings opportunities through spend analysis and supplier consolidation",
    usage: "Implement recommended actions to achieve projected savings",
    icon: Zap,
    color: "bg-yellow-500",
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-8 px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ProcureIQ</h1>
          <p className="text-muted-foreground text-lg">
            Your AI-powered procurement intelligence platform. Let's get you started with the key features.
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-8 card-enterprise">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <CardTitle>Quick Start Guide</CardTitle>
            </div>
            <CardDescription>Follow these steps to get the most out of your ProcureIQ platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickStartSteps.map((step) => (
                <Card key={step.step} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={step.status === "recommended" ? "default" : "secondary"}>
                        {step.status === "recommended" ? "Start Here" : step.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
                    <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                      <Link href={step.href} className="flex items-center justify-center gap-2">
                        {step.action}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Key Metrics */}
          <Card className="card-enterprise">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Key Metrics
              </CardTitle>
              <CardDescription>Your procurement overview at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardMetrics.totalSpend}</p>
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardMetrics.suppliers}</p>
                  <p className="text-sm text-muted-foreground">Active Suppliers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardMetrics.pendingInsights}</p>
                  <p className="text-sm text-muted-foreground">Pending Insights</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{dashboardMetrics.savingsOpportunity}</p>
                  <p className="text-sm text-muted-foreground">Savings Opportunity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-enterprise">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to key platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/insights-approval" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Review {dashboardMetrics.pendingInsights} Pending Insights
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/ai-assistant" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Ask AI Assistant
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/data-catalog" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Explore Data Catalog
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Help & Resources */}
          <Card className="card-enterprise">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Help & Resources
              </CardTitle>
              <CardDescription>Learn how to use the platform effectively</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Getting Started Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Start with Insights Approval to understand AI recommendations</li>
                  <li>• Use AI Assistant for natural language queries</li>
                  <li>• Explore Data Catalog to understand your data sources</li>
                  <li>• Configure alerts in Settings for proactive monitoring</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href="/ai-assistant" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Ask for Help
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Platform Features Guide */}
        <Card className="card-enterprise">
          <CardHeader>
            <CardTitle>How to Use ProcureIQ Features</CardTitle>
            <CardDescription>
              Understanding each feature and how to get the most value from your platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platformFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div
                    className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                    <p className="text-xs text-primary font-medium">💡 {feature.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
