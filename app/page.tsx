"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Brain, Shield, TrendingUp, Zap, CheckCircle } from "lucide-react"
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function MarketingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isSignedIn) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
            AI-Powered Procurement Intelligence Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-pretty">
            Transform your procurement operations with real-time predictive insights, automated reconciliation, and
            intelligent analytics. Make data-driven decisions that drive cost savings and operational excellence.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <SignUpButton mode="modal">
              <Button size="lg" className="btn-enterprise btn-primary">
                Get Started Free
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="btn-enterprise bg-transparent">
                Sign In
              </Button>
            </SignInButton>
          </div>
          <p className="text-sm text-muted-foreground">Join procurement teams already saving millions with ProcureIQ</p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need to Master Procurement</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our comprehensive platform provides the tools and insights you need to optimize spend, manage risk, and
            drive strategic value.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ask natural language questions about your procurement data and get instant insights
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Insights Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Review and approve AI-generated insights to ensure accuracy and relevance
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Data Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Explore and understand your procurement data sources and their relationships
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Settings & Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Configure your platform preferences and manage user access controls</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">Powerful Capabilities</h3>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Advanced features designed to transform how you manage procurement operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Automated Reconciliation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Seamlessly match transactions across ERP and procurement systems</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Intelligent variance detection and automated anomaly identification</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Proactive supplier and geographic risk monitoring and mitigation</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Spend Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Comprehensive spending pattern analysis and optimization insights</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Exception Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Automatically flag and manage discrepancies for efficient review</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Data Validation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Automated quality checks and intelligent data enrichment</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Performance Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Real-time KPI monitoring and comprehensive reporting</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center card-enterprise">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-driven identification of savings opportunities and cost reduction strategies
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">Why Choose ProcureIQ</h3>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Experience the benefits that leading procurement teams rely on
          </p>

          <div className="space-y-4 max-w-4xl mx-auto">
            <Card className="card-enterprise">
              <CardContent className="p-6">
                <p className="text-foreground">
                  Multi-system data reconciliation with real-time variance detection and automated resolution
                </p>
              </CardContent>
            </Card>

            <Card className="card-enterprise">
              <CardContent className="p-6">
                <p className="text-foreground">
                  AI-powered supplier performance monitoring with predictive risk analysis and mitigation strategies
                </p>
              </CardContent>
            </Card>

            <Card className="card-enterprise">
              <CardContent className="p-6">
                <p className="text-foreground">
                  Automated exception handling with intelligent contract compliance monitoring and alerts
                </p>
              </CardContent>
            </Card>

            <Card className="card-enterprise">
              <CardContent className="p-6">
                <p className="text-foreground">
                  Advanced spend categorization with AI-driven cost optimization insights and recommendations
                </p>
              </CardContent>
            </Card>

            <Card className="card-enterprise">
              <CardContent className="p-6">
                <p className="text-foreground">
                  Executive dashboards with predictive analytics, real-time reporting, and strategic insights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Procurement?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join leading organizations already using ProcureIQ to drive cost savings and operational excellence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button size="lg" variant="secondary" className="btn-enterprise">
                Start Your Free Trial
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button
                size="lg"
                variant="outline"
                className="btn-enterprise border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      </section>
    </div>
  )
}
