"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  Calendar,
  Users,
  Brain,
  Star,
  HelpCircle,
  BookOpen,
  Target,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

// Mock insights data based on the screenshots
const insightsData = [
  {
    id: 1,
    insight: "Supplier Concentration Risk",
    description:
      "ILENSYS TECHNOLOGIES will likely exceed 20% spend concentration by Q2 2025, requiring immediate diversification to backup suppliers creating critical dependency risk.",
    impact: "$3.94M at risk",
    confidence: 87,
    status: "pending",
    costCenter: "R&D Engineering",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/25/2025",
    notes: "Immediate action required: Identify backup sup...",
    priority: "high",
    category: "Risk Management",
  },
  {
    id: 2,
    insight: "Professional Services Consolidation",
    description: "Consolidating 47 professional service suppliers to 20 will generate $850K savings within 6 months",
    impact: "$850K potential savings",
    confidence: 92,
    status: "approved",
    costCenter: "IT Operations",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/23/2025",
    notes: "No notes",
    priority: "high",
    category: "Cost Optimization",
  },
  {
    id: 3,
    insight: "Contract Terms Optimization",
    description: "Negotiating payment terms from 45 to 30 days will improve cash flow by $605K annually",
    impact: "$605K cash flow improvement",
    confidence: 74,
    status: "pending",
    costCenter: "Finance",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/25/2025",
    notes: "No notes",
    priority: "medium",
    category: "Finance",
  },
  {
    id: 4,
    insight: "Geographic Concentration Risk",
    description: "Supply chain disruption probability will increase 40% if Southeast concentration exceeds 70%",
    impact: "$8.95M supply chain risk",
    confidence: 89,
    status: "approved",
    costCenter: "Manufacturing",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/19/2025",
    notes: "No notes",
    priority: "high",
    category: "Risk Management",
  },
  {
    id: 5,
    insight: "Small Transaction Inefficiency",
    description: "Implementing P-card program for transactions under $1K will reduce processing costs by $105K",
    impact: "$105K processing cost",
    confidence: 81,
    status: "pending",
    costCenter: "Procurement",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/23/2025",
    notes: "No notes",
    priority: "medium",
    category: "Process Improvement",
  },
  {
    id: 6,
    insight: "Q4 Spend Surge Analysis",
    description: "Q1 2025 budget allocation adjustments will prevent 37% Q4 spending surge recurrence",
    impact: "$2.1M budget optimization",
    confidence: 78,
    status: "approved",
    costCenter: "Finance",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/16/2025",
    notes: "No notes",
    priority: "medium",
    category: "Budget Management",
  },
]

export default function InsightsApprovalPage() {
  const [selectedInsight, setSelectedInsight] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [notes, setNotes] = useState("")
  const [showInstructions, setShowInstructions] = useState(true)

  const filteredInsights = insightsData.filter((insight) => {
    if (filterStatus !== "all" && insight.status !== filterStatus) return false
    if (filterPriority !== "all" && insight.priority !== filterPriority) return false
    return true
  })

  const handleApprove = (id: number) => {
    // In a real app, this would update the backend
    console.log(`Approved insight ${id}`)
  }

  const handleReject = (id: number) => {
    // In a real app, this would update the backend
    console.log(`Rejected insight ${id}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Insights Approval</h1>
              <p className="text-muted-foreground text-lg">
                Review and validate AI-generated procurement insights to ensure accuracy and relevance
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {showInstructions ? "Hide" : "Show"} Guide
            </Button>
          </div>

          {showInstructions && (
            <Card className="card-enterprise mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  How to Use Insights Approval
                </CardTitle>
                <CardDescription>
                  This is your first stop for validating AI recommendations. Follow these steps to get the most value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <h4 className="font-semibold">Review High Priority First</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start with high-priority insights marked with ⭐. These typically involve significant financial
                      impact or risk.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <AlertTriangle className="h-3 w-3" />
                      Focus on insights with confidence scores above 80%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <h4 className="font-semibold">Validate Against Context</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Check if the insight aligns with your business strategy, current initiatives, and market
                      conditions.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Brain className="h-3 w-3" />
                      AI insights are based on data patterns, not business context
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <h4 className="font-semibold">Take Action</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Approve actionable insights, reject irrelevant ones, and add notes for future reference or team
                      collaboration.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <MessageSquare className="h-3 w-3" />
                      Use notes to explain your decision rationale
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Quick Tips for Better Decisions
                  </h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • <strong>High confidence (85%+):</strong> Usually safe to approve if business context aligns
                    </li>
                    <li>
                      • <strong>Medium confidence (70-84%):</strong> Requires careful review and validation
                    </li>
                    <li>
                      • <strong>Low confidence (&lt;70%):</strong> Consider rejecting or requesting more data
                    </li>
                    <li>
                      • <strong>Financial impact:</strong> Larger impacts deserve more scrutiny and stakeholder input
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Back Navigation */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="card-enterprise mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search Insights</CardTitle>
            <CardDescription>
              Use filters to focus on specific types of insights. Start with "Pending" status to see items requiring
              your attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Search by insight title, cost center, or impact..." className="max-w-sm" />

              <div className="text-sm text-muted-foreground">
                {filteredInsights.length} insights • {filteredInsights.filter((i) => i.status === "pending").length}{" "}
                pending review
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Table */}
        <Card className="card-enterprise">
          <CardHeader>
            <CardTitle>Procurement Insights</CardTitle>
            <CardDescription>
              AI-generated recommendations based on your procurement data. Review each insight carefully before
              approving or rejecting.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-4 font-medium">INSIGHT</th>
                    <th className="p-4 font-medium">IMPACT</th>
                    <th className="p-4 font-medium">CONFIDENCE</th>
                    <th className="p-4 font-medium">STATUS</th>
                    <th className="p-4 font-medium">COST CENTER</th>
                    <th className="p-4 font-medium">SOURCE</th>
                    <th className="p-4 font-medium">DATA SOURCE</th>
                    <th className="p-4 font-medium">UPDATED</th>
                    <th className="p-4 font-medium">NOTES</th>
                    <th className="p-4 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.map((insight, index) => (
                    <tr key={insight.id} className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                      <td className="p-4">
                        <div className="max-w-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                              {insight.priority === "high" && <Star className="h-3 w-3 mr-1" />}
                              {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                            </Badge>
                            {insight.priority === "high" && (
                              <Badge variant="outline" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-sm mb-1">{insight.insight}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-primary">{insight.impact}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Progress value={insight.confidence} className="w-16 h-2" />
                          <span className="text-sm font-medium">{insight.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`text-xs text-white ${getStatusColor(insight.status)}`}>
                          {insight.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{insight.costCenter}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          {insight.source === "AI" ? (
                            <Brain className="h-4 w-4 text-primary" />
                          ) : (
                            <Users className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="text-sm">{insight.source}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{insight.dataSource}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{insight.updated}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs">
                              {insight.notes === "No notes" ? "Add notes +" : insight.notes}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Notes - {insight.insight}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Add context about why you approved/rejected this insight, or notes for future reference.
                              </p>
                              <Textarea
                                placeholder="Example: 'Approved - aligns with Q1 cost reduction initiative. Will coordinate with supplier management team.'"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-24"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                Cancel
                              </Button>
                              <Button size="sm">Save Notes</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          {insight.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(insight.id)}
                                title="Approve this insight"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(insight.id)}
                                title="Reject this insight"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            title="Discuss this insight"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
