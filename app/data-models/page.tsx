"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Database, 
  Search, 
  BarChart3, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Settings,
  FileText,
  Calculator,
  Clock,
  ChevronDown,
  ChevronUp,
  Table,
  MapPin
} from "lucide-react"
import { Sidebar } from "@/components/ui/sidebar"

// Complete procurement dataset schema
const procurementSchema = [
  // Temporal Dimensions
  { 
    category: "Temporal", 
    field: "Fiscal Year Number", 
    type: "Integer", 
    description: "The fiscal year when the transaction occurred", 
    samples: "2023, 2024, 2025", 
    uniqueCount: 3 
  },
  { 
    category: "Temporal", 
    field: "Fiscal Year Month", 
    type: "String", 
    description: "Fiscal year and month in YYYY-MM format", 
    samples: "2023-01, 2023-02, 2024-12", 
    uniqueCount: 32 
  },
  { 
    category: "Temporal", 
    field: "Fiscal Year Week", 
    type: "String", 
    description: "Fiscal year and week number in YYYY-W format", 
    samples: "2023-1, 2024-52", 
    uniqueCount: 135 
  },
  { 
    category: "Temporal", 
    field: "Fiscal Day", 
    type: "String", 
    description: "The specific transaction date in M/D/YYYY format", 
    samples: "1/3/2023, 12/15/2024", 
    uniqueCount: 676 
  },
  { 
    category: "Temporal", 
    field: "Finalization Date", 
    type: "String", 
    description: "Date when the transaction was finalized/approved in M/D/YYYY format", 
    samples: "1/3/2023, 12/15/2024", 
    uniqueCount: 676 
  },
  
  // Organizational Structure
  { 
    category: "Organizational", 
    field: "HFM Entity", 
    type: "String", 
    description: "Hyperion Financial Management entity representing different business units or locations", 
    samples: "LEAshevilleOther, LEAsheville, LETiger-SVC, LEGroupOffice", 
    uniqueCount: 8 
  },
  { 
    category: "Organizational", 
    field: "HFM Cost Group", 
    type: "String", 
    description: "High-level cost classification categories for financial reporting", 
    samples: "Manufacturing Overhead, Marketing, Service Overhead, R&D, G&A, Selling", 
    uniqueCount: 6 
  },
  { 
    category: "Organizational", 
    field: "Cost Center Code", 
    type: "Integer", 
    description: "Numeric identifier for the specific department or cost center", 
    samples: "106410, 101100, 998316", 
    uniqueCount: 128 
  },
  { 
    category: "Organizational", 
    field: "Cost Center", 
    type: "String", 
    description: "Descriptive name of the operational cost center", 
    samples: "Avl - Mfg Engineering, Marketing - Corporate, Service Operations", 
    uniqueCount: 128 
  },
  
  // Financial Classification
  { 
    category: "Financial", 
    field: "FIM Account", 
    type: "String", 
    description: "Financial Information Management account category", 
    samples: "ExpensedSupplies, MaintenanceAndRepair, OtherProfessionalFees", 
    uniqueCount: 26 
  },
  { 
    category: "Financial", 
    field: "Account Code", 
    type: "Integer", 
    description: "Numeric chart of accounts identifier", 
    samples: "67340, 72120, 70150", 
    uniqueCount: 54 
  },
  { 
    category: "Financial", 
    field: "Account", 
    type: "String", 
    description: "Detailed account description corresponding to the account code", 
    samples: "Mfg Supplies - Consumables, Marketing Other (&Sales Promo), Consultants - India", 
    uniqueCount: 54 
  },
  { 
    category: "Financial", 
    field: "Amount", 
    type: "String (Currency)", 
    description: "Transaction amount in USD with dollar sign and formatting", 
    samples: "$279.20, $45,720.74, $503,871.50", 
    uniqueCount: 14753 
  }
]

const categoryColors = {
  "Temporal": "border-l-blue-400",
  "Organizational": "border-l-green-400", 
  "Financial": "border-l-orange-400"
}

const categoryIcons = {
  "Temporal": Clock,
  "Organizational": Settings,
  "Financial": Calculator
}

// Database structure configuration
const databaseStructure = [
  {
    id: 'procurement_analytics',
    name: 'Overhead Transactional Data - Asheville',
    description: 'Primary financial analytics database with transactional data from Asheville operations',
    location: 'Asheville',
    status: 'active',
    tables: [
      {
        id: 'financial_data',
        name: 'financial_data',
        description: 'Core overhead transactional data for Asheville location',
        recordCount: 26111,
        totalValue: '$48.8M',
        fields: procurementSchema
      }
    ]
  },
  {
    id: 'operational_systems',
    name: 'Baan ERP',
    description: 'Future integration with operational systems data',
    location: 'Multi-location',
    status: 'planned',
    tables: []
  },
  {
    id: 'vendor_management',
    name: 'SAP', 
    description: 'Vendor relationship and performance data',
    location: 'Multi-location',
    status: 'planned',
    tables: []
  }
]

export default function DataModelsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [collapsedDatabases, setCollapsedDatabases] = useState<string[]>([])
  const [collapsedTables, setCollapsedTables] = useState<string[]>([])

  const toggleDatabase = (databaseId: string) => {
    setCollapsedDatabases(prev => 
      prev.includes(databaseId) 
        ? prev.filter(id => id !== databaseId)
        : [...prev, databaseId]
    )
  }

  const toggleTable = (tableId: string) => {
    setCollapsedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    )
  }

  const filteredSchema = procurementSchema.filter(field =>
    field.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Sidebar>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Asheville Focus</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>3 databases • 1 active table</span>
            </div>
          </div>
        </div>


        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search databases, tables, or fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Structure */}
        <div className="space-y-6">
          {databaseStructure.map((database) => (
            <Card key={database.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">{database.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-sm text-gray-600">{database.location}</span>
                        </div>
                        <Badge 
                          variant={database.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {database.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDatabase(database.id)}
                    className="h-8 w-8 p-0"
                  >
                    {collapsedDatabases.includes(database.id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronUp className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <p className="text-gray-600 mt-2">{database.description}</p>
              </CardHeader>
              
              {!collapsedDatabases.includes(database.id) && (
                <CardContent className="pt-0">
                  {database.tables.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Database planned for future implementation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {database.tables.map((table) => (
                        <Card key={table.id} className="bg-gray-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Table className="h-5 w-5 text-green-600" />
                                <div>
                                  <CardTitle className="text-lg">{table.name}</CardTitle>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-gray-600">{table.recordCount?.toLocaleString()} records</span>
                                    <span className="text-sm text-gray-600">{table.totalValue}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTable(table.id)}
                                className="h-6 w-6 p-0"
                              >
                                {collapsedTables.includes(table.id) ? 
                                  <ChevronDown className="h-3 w-3" /> : 
                                  <ChevronUp className="h-3 w-3" />
                                }
                              </Button>
                            </div>
                            <p className="text-gray-600 text-sm">{table.description}</p>
                          </CardHeader>
                          
                          {!collapsedTables.includes(table.id) && table.fields && (
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {filteredSchema.map((field, idx) => {
                                  const IconComponent = categoryIcons[field.category as keyof typeof categoryIcons]
                                  return (
                                    <Card key={idx} className={`${categoryColors[field.category as keyof typeof categoryColors]} border-l-2`}>
                                      <CardContent className="pt-3 pb-3">
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center text-sm">
                                          <div className="flex items-center gap-2">
                                            <IconComponent className="h-3 w-3 text-gray-500" />
                                            <Badge variant="outline" className="text-xs">{field.category}</Badge>
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{field.field}</div>
                                            <Badge variant="secondary" className="text-xs mt-1">{field.type}</Badge>
                                          </div>
                                          <div className="md:col-span-2">
                                            <div className="text-sm text-gray-700">{field.description}</div>
                                          </div>
                                          <div>
                                            <div className="text-xs font-mono text-gray-600">{field.samples}</div>
                                          </div>
                                          <div>
                                            <Badge variant="outline" className="text-xs">{field.uniqueCount} unique</Badge>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                })}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Data Quality & Architecture Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Platform Status & Data Quality
            </CardTitle>
            <p className="text-gray-600">Current system capabilities and future expansion roadmap</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Active Systems */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">Active Systems (Asheville)</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Procurement Analytics:</strong> 26,111 complete records with full field coverage
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Financial Data:</strong> $48.8M in overhead transactions with consistent formatting
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Entity Coverage:</strong> 8 HFM entities with 128 cost centers across Asheville operations
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Time Alignment:</strong> Consistent fiscal periods (2023-2025) with proper date relationships
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </CardContent>
        </Card>
      </div>
    </Sidebar>
  )
}