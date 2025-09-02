"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Check, X, MessageSquare, Calendar, Users, Brain, Star } from "lucide-react"
import Link from "next/link"

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
      {/* Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">SpendSmart</h1>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
                <Link href="/ai-assistant" className="text-muted-foreground hover:text-primary">
                  AI Assistant
                </Link>
                <Link href="/insights-approval" className="text-primary font-medium border-b-2 border-primary pb-1">
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
              <span className="text-sm text-muted-foreground">mike@agenticlabs.io</span>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Back Navigation */}
        <div className="flex items-center mb-6">
          <Link href="/ai-assistant" className="flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Assistant
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Search insights..." className="max-w-sm" />
        </div>

        {/* Insights Table */}
        <Card>
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
                              {insight.notes === "No notes" ? "No notes +" : insight.notes}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Notes</DialogTitle>
                            </DialogHeader>
                            <Textarea
                              placeholder="Add your notes here..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="min-h-24"
                            />
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
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(insight.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
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
