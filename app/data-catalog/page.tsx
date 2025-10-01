"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { dataSourceColumns, dataCatalogFilterOptions, type DataSource } from "@/components/ui/data-catalog-columns"
import { ChevronRight, Database, Shield, Clock, Users, Search, MessageCircle } from "lucide-react"
import Link from "next/link"

const dataSources: DataSource[] = [
  {
    id: 1,
    name: "Coupa Platform",
    description: "Comprehensive procurement transactions and supplier data",
    records: "1.2M",
    status: "Active",
    classification: "Internal",
    owner: "Procurement Team",
    lastUpdated: "2025-09-28",
    updateFrequency: "Real-time",
    source: "Coupa API"
  },
  {
    id: 2,
    name: "Baan ERP",
    description: "Financial transactions and accounting data",
    records: "894K",
    status: "Active",
    classification: "Confidential",
    owner: "Finance Team",
    lastUpdated: "2025-09-28",
    updateFrequency: "Daily",
    source: "Baan Database"
  },
  {
    id: 3,
    name: "Analytics Engine",
    description: "Derived metrics and calculated KPIs",
    records: "10.2K",
    status: "Active",
    classification: "Internal",
    owner: "Analytics Team",
    lastUpdated: "2025-09-27",
    updateFrequency: "Weekly",
    source: "Data Warehouse"
  },
  {
    id: 4,
    name: "Cost Center Data",
    description: "Organizational cost center hierarchy and allocations",
    records: "2.8K",
    status: "Active",
    classification: "Internal",
    owner: "FP&A Team",
    lastUpdated: "2025-09-26",
    updateFrequency: "Monthly",
    source: "HFM System"
  },
  {
    id: 5,
    name: "Vendor Master",
    description: "Supplier information and vendor relationships",
    records: "15.7K",
    status: "Maintenance",
    classification: "Confidential",
    owner: "Procurement Team",
    lastUpdated: "2025-09-25",
    updateFrequency: "Daily",
    source: "Vendor Management System"
  }
]

const quickQueries = [
  "Show procurement transaction table schema",
  "Display supplier data statistics", 
  "Analyze cost center allocations",
  "Review contract data structure"
]

export default function DataCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleQuickQuery = (query: string) => {
    // Navigate to chat with pre-filled query
    window.location.href = `/chat?q=${encodeURIComponent(query)}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">Smarthead</h1>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
                <Link href="/ai-assistant" className="text-muted-foreground hover:text-primary">AI Assistant</Link>
                <Link href="/chat" className="text-muted-foreground hover:text-primary">Live Chat</Link>
                <Link href="/insights-approval" className="text-muted-foreground hover:text-primary">Insights</Link>
                <Link href="/data-catalog" className="text-primary font-medium border-b-2 border-primary pb-1">Data</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/sign-out">Sign Out</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Data Catalog</h2>
            <p className="text-muted-foreground">Explore overhead cost data sources and schemas</p>
          </div>
          <Button asChild>
            <Link href="/chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Query Data
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables, columns, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Sources Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Data Sources</span>
                  <Badge variant="outline" className="ml-2">
                    {dataSources.length} sources
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDataTable
                  columns={dataSourceColumns}
                  data={dataSources}
                  searchKey="name"
                  placeholder="Search data sources..."
                  filterableColumns={dataCatalogFilterOptions}
                  enableRowSelection={false}
                  enableColumnVisibility={true}
                  enableExport={true}
                  exportFileName="data-catalog"
                  onRowClick={(source) => {
                    handleQuickQuery(`Show ${source.name} schema and structure`)
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Quick Queries</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3"
                    onClick={() => handleQuickQuery(query)}
                  >
                    <div className="text-xs">{query}</div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Data Governance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span>Access: Procurement Teams</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>Updates: Real-time</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3" />
                  <span>Compliance: SOX</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-medium">1.3M+</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Sources:</span>
                  <span className="font-medium">3 Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="font-medium">2 min ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}