"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, ChevronDown, Database, Shield, Clock, CheckCircle, Users, FileText } from "lucide-react"
import Link from "next/link"

// Mock data sources
const dataSources = [
  {
    name: "Coupa Platform",
    description: "Procurement transactions",
    status: "Active",
    type: "Primary Data Source",
    lastSync: "2 hours ago",
  },
  {
    name: "Baan ERP",
    description: "Financial transactions",
    status: "Active",
    type: "Financial System",
    lastSync: "1 hour ago",
  },
  {
    name: "Analytics Engine",
    description: "Derived metrics",
    status: "Active",
    type: "Analytics Platform",
    lastSync: "30 minutes ago",
  },
]

// Mock table data based on screenshots
const tableData = [
  {
    name: "tbl_procuresmart_chatbot_data",
    description: "Final consolidated spend data serving as the primary data source for the ProcureSmart AI chatbot",
    records: "10,666",
    columns: "13",
    owner: "Procurement Analytics Team",
    classification: "Internal Business Data",
    updateFrequency: "Daily",
    sourceFile: "finalspendraw.csv",
    expanded: false,
  },
  {
    name: "tbl_baan_cost_center_transactions",
    description: "Comprehensive transaction data from Baan ERP platform capturing cost center and account allocations",
    records: "1,025",
    columns: "44",
    owner: "ERP Systems Team",
    classification: "Financial Data",
    updateFrequency: "Real-time via ETL",
    sourceFile: "BaanPNG.csv",
    expanded: false,
  },
  {
    name: "tbl_coupa_procurement_transactions",
    description: "Coupa platform procurement and overhead spend transactional data for location-based analysis",
    records: "1,143",
    columns: "31",
    owner: "Procurement Operations Team",
    classification: "Procurement Data",
    updateFrequency: "Near Real-time",
    sourceFile: "Coupa2monthnashville.csv",
    expanded: false,
  },
  {
    name: "tbl_integrated_procurement_reconciliation",
    description:
      "Merged Baan ERP and Coupa procurement data with invoice-based reconciliation and data quality metrics",
    records: "3,094",
    columns: "50",
    owner: "Data Integration Team",
    classification: "Integrated Business Data",
    updateFrequency: "Daily ETL Process",
    sourceFile: "mergedcitpoc2.csv",
    expanded: false,
  },
]

export default function DataCatalogPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedTables, setExpandedTables] = useState<string[]>([])

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTables((prev) =>
      prev.includes(tableName) ? prev.filter((name) => name !== tableName) : [...prev, tableName],
    )
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
                <Link href="/insights-approval" className="text-muted-foreground hover:text-primary">
                  Insights Approval
                </Link>
                <Link href="/data-catalog" className="text-primary font-medium border-b-2 border-primary pb-1">
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
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">ProcureSmart Database Schema</h2>
          <p className="text-muted-foreground">Comprehensive data catalog for the ProcureSmart Analytics Platform</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview & Governance</TabsTrigger>
            <TabsTrigger value="tables">Tables & Schema Details</TabsTrigger>
          </TabsList>

          {/* Overview & Governance Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Sources & Connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Data Sources & Connections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{source.name}</h3>
                        <p className="text-sm text-muted-foreground">{source.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last sync: {source.lastSync}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{source.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Data Governance & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Data Governance & Compliance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Access Control */}
                  <div>
                    <h3 className="font-medium mb-2">Access Control</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3" />
                        <span>Read: Procurement, Finance, Analytics Teams</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3" />
                        <span>Write: ETL Service Accounts Only</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3" />
                        <span>Admin: Database Administrators, Data Stewards</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Quality Standards */}
                  <div>
                    <h3 className="font-medium mb-2">Data Quality Standards</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Completeness: High for required fields</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Accuracy: Low variance in reconciliation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span>Timeliness: Data available within 24 hours</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Consistency: Standardized formats</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Requirements */}
                  <div>
                    <h3 className="font-medium mb-2">Compliance Requirements</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3" />
                        <span>Financial Reporting: SOX compliance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3" />
                        <span>Data Retention: 7-year retention</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3" />
                        <span>Audit Trail: Complete transaction logging</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3" />
                        <span>Privacy: No PII in analytics tables</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tables & Schema Details Tab */}
          <TabsContent value="tables" className="space-y-6">
            <div className="space-y-4">
              {tableData.map((table, index) => (
                <Card key={index}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-mono text-sm font-medium">{table.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {table.records} records
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {table.columns} columns
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{table.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Owner</span>
                              <div className="font-medium">{table.owner}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Classification</span>
                              <div className="font-medium">{table.classification}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Update Frequency</span>
                              <div className="font-medium">{table.updateFrequency}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Source File</span>
                              <div className="font-medium">{table.sourceFile}</div>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTableExpansion(table.name)}
                          className="ml-4"
                        >
                          {expandedTables.includes(table.name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="ml-2">View Schema Details</span>
                        </Button>
                      </div>
                    </div>

                    {expandedTables.includes(table.name) && (
                      <div className="p-4 bg-muted/20">
                        <h4 className="font-medium mb-3">Schema Details</h4>
                        <div className="text-sm text-muted-foreground">
                          <p>Detailed schema information would be displayed here, including:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Column names and data types</li>
                            <li>Primary and foreign key relationships</li>
                            <li>Indexes and constraints</li>
                            <li>Sample data preview</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
