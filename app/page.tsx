"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Brain, Shield, TrendingUp, Zap, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

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
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <Navigation />

      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            AI-enabled real-time predictive Insights and Analytics
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Essential tools for financial reconciliation and analysis
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button asChild size="lg">
              <Link href="/ai-assistant">
                <Brain className="mr-2 h-5 w-5" />
                AI Assistant
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/settings">Settings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <div className="container mx-auto">
        <section className="py-8 px-4 bg-muted/30">
          <div className="container mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Access key platform features and tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  >
                    <Link href="/ai-assistant">
                      <Brain className="h-6 w-6 text-primary" />
                      <span>AI Assistant</span>
                      <span className="text-xs text-muted-foreground">Ask questions about your data</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  >
                    <Link href="/insights-approval">
                      <CheckCircle className="h-6 w-6 text-primary" />
                      <span>Approve Insights</span>
                      <span className="text-xs text-muted-foreground">Review pending insights</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  >
                    <Link href="/data-catalog">
                      <BarChart3 className="h-6 w-6 text-primary" />
                      <span>Data Catalog</span>
                      <span className="text-xs text-muted-foreground">Explore data sources</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  >
                    <Link href="/settings">
                      <Shield className="h-6 w-6 text-primary" />
                      <span>Settings</span>
                      <span className="text-xs text-muted-foreground">Manage preferences</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center mb-4">Core Features</h3>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Essential tools for financial reconciliation and analysis
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Automated Reconciliation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Match transactions across ERP and procurement systems</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Intelligent variance detection and anomaly identification</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Exception Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Flag and manage discrepancies for review</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Spend Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Comprehensive spending pattern analysis</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Supplier and geographic risk monitoring</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Data Validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Quality checks and data enrichment</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Performance Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>KPI monitoring and reporting</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Cost Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Identify savings opportunities</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center mb-4">Platform Capabilities</h3>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Comprehensive functionality for procurement teams
            </p>

            <div className="space-y-4 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground">Multi-system data reconciliation with real-time variance detection</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground">AI-powered supplier performance monitoring and risk analysis</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground">Automated exception handling and contract compliance monitoring</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground">Advanced spend categorization and cost optimization insights</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-foreground">Executive dashboards with predictive analytics and reporting</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
