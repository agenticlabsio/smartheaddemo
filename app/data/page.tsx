"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { dataTableColumns, dataTableFilterOptions, type Dataset } from "@/components/ui/data-table-columns"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Database, 
  Search, 
  Filter, 
  Download,
  Eye,
  BarChart3,
  Calendar,
  DollarSign,
  Building,
  Users,
  TrendingUp,
  FileText,
  Star,
  Clock,
  Brain,
  Zap,
  Layers,
  Settings,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

// Real data based on actual database contents
const datasets: Dataset[] = [
  {
    id: "coupa-financial",
    name: "Coupa Financial Data",
    description: "Complete financial data from legacy Coupa system covering fiscal years 2023-2025",
    category: "Financial",
    recordCount: 26111,
    lastUpdated: "2025-08-06",
    size: "1.2 GB",
    format: "PostgreSQL",
    tags: ["coupa", "financial", "fiscal", "entities", "cost-groups"],
    quality: 0.96,
    usage: "high",
    owner: "Finance Team",
    schema: {
      columns: ["fiscal_year_number", "hfm_entity", "hfm_cost_group", "account", "cost_center", "amount", "fiscal_day"],
      types: ["integer", "varchar", "varchar", "varchar", "varchar", "decimal", "date"]
    },
    preview: [
      { fiscal_year_number: 2023, hfm_entity: "LEAshevilleOther", hfm_cost_group: "Manufacturing Overhead", account: "Mfg Supplies - Consumables", cost_center: "Avl - Maintenance", amount: 279.20, fiscal_day: "2023-01-03" },
      { fiscal_year_number: 2023, hfm_entity: "LEAshevilleOther", hfm_cost_group: "Manufacturing Overhead", account: "Mfg Supplies - Consumables", cost_center: "Avl - Maintenance", amount: 499.50, fiscal_day: "2023-01-03" },
      { fiscal_year_number: 2025, hfm_entity: "LEAshevilleOther", hfm_cost_group: "Manufacturing Overhead", account: "Equipment Maintenance", cost_center: "Avl - Production", amount: 1250.00, fiscal_day: "2025-08-01" }
    ],
    totalValue: 48832439.05,
    dateRange: "2023-01-03 to 2025-08-06",
    uniqueEntities: 8,
    uniqueCostGroups: 6
  },
  {
    id: "baan-procurement",
    name: "Baan Procurement Data",
    description: "ERP procurement transactions from Asheville operations covering 2023-2025",
    category: "Procurement",
    recordCount: 14768,
    lastUpdated: "2025-06-30",
    size: "850 MB",
    format: "PostgreSQL",
    tags: ["baan", "procurement", "suppliers", "commodities", "asheville"],
    quality: 0.94,
    usage: "high",
    owner: "Procurement Team",
    schema: {
      columns: ["supplier", "commodity", "description", "reporting_total", "invoice_created_date", "quarter_year", "po_ship_to_city"],
      types: ["varchar", "varchar", "text", "decimal", "date", "varchar", "varchar"]
    },
    preview: [
      { supplier: "OCEASOFT SA_US_70712482", commodity: "Professional Services", description: "Blanket PO for 2025 Dickson Smart-Vue Pro Cloud Services through June 2025", reporting_total: 36217.50, invoice_created_date: "2025-06-30", quarter_year: "Q2-2025", po_ship_to_city: "Asheville" },
      { supplier: "FASTENAL CO_US_323253", commodity: "MRO Services", description: "White/Black Versaflo[TM] PAPR System w/ Faceshield", reporting_total: 2422.00, invoice_created_date: "2025-06-30", quarter_year: "Q2-2025", po_ship_to_city: "Asheville" },
      { supplier: "INSITE SOLUTIONS LLC_US_70649913", commodity: "MRO Services", description: "Superior Mark® Floor Marking Tape", reporting_total: 359.10, invoice_created_date: "2025-06-30", quarter_year: "Q2-2025", po_ship_to_city: "Asheville" }
    ],
    totalValue: 37811079.78,
    dateRange: "2023-01-02 to 2025-06-30",
    uniqueSuppliers: 392,
    uniqueCommodities: 103
  },
  {
    id: "supplier-analysis",
    name: "Supplier Performance Analysis",
    description: "Aggregated supplier metrics, performance scores, and spending patterns",
    category: "Analytics",
    recordCount: 392,
    lastUpdated: "2025-06-30",
    size: "45 MB",
    format: "PostgreSQL View",
    tags: ["suppliers", "performance", "analytics", "spend-analysis"],
    quality: 0.91,
    usage: "medium",
    owner: "Procurement Team",
    schema: {
      columns: ["supplier_name", "total_spend", "transaction_count", "avg_invoice_value", "commodity_categories", "risk_score"],
      types: ["varchar", "decimal", "integer", "decimal", "varchar", "decimal"]
    },
    preview: [
      { supplier_name: "OCEASOFT SA_US_70712482", total_spend: 125000.50, transaction_count: 45, avg_invoice_value: 2777.79, commodity_categories: "Professional Services", risk_score: 0.25 },
      { supplier_name: "FASTENAL CO_US_323253", total_spend: 89750.25, transaction_count: 178, avg_invoice_value: 504.21, commodity_categories: "MRO Services", risk_score: 0.15 },
      { supplier_name: "INSITE SOLUTIONS LLC_US_70649913", total_spend: 67250.00, transaction_count: 134, avg_invoice_value: 501.87, commodity_categories: "MRO Services, Office Supplies", risk_score: 0.20 }
    ]
  },
  {
    id: "cost-center-analysis",
    name: "Cost Center Spending Analysis",
    description: "Financial analysis by cost center with budget variance tracking",
    category: "Financial",
    recordCount: 156,
    lastUpdated: "2025-08-06",
    size: "35 MB",
    format: "PostgreSQL View",
    tags: ["cost-center", "budget", "variance", "financial-analysis"],
    quality: 0.97,
    usage: "high",
    owner: "Finance Team",
    schema: {
      columns: ["cost_center", "total_spend", "transaction_count", "avg_amount", "entity", "cost_group"],
      types: ["varchar", "decimal", "integer", "decimal", "varchar", "varchar"]
    },
    preview: [
      { cost_center: "Avl - Maintenance", total_spend: 8750000.50, transaction_count: 5250, avg_amount: 1666.67, entity: "LEAshevilleOther", cost_group: "Manufacturing Overhead" },
      { cost_center: "Avl - Production", total_spend: 12500000.75, transaction_count: 7890, avg_amount: 1584.25, entity: "LEAshevilleOther", cost_group: "Manufacturing Direct" },
      { cost_center: "Avl - Quality", total_spend: 3250000.25, transaction_count: 2150, avg_amount: 1511.63, entity: "LEAshevilleOther", cost_group: "Quality Assurance" }
    ]
  }
]

const categories = ["All", "Financial", "Procurement", "Analytics"]
const usageTypes = ["All", "High", "Medium", "Low"]

export default function DataPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedUsage, setSelectedUsage] = useState("All")
  const [selectedDataset, setSelectedDataset] = useState<typeof datasets[0] | null>(null)
  const [semanticSearchQuery, setSemanticSearchQuery] = useState("")
  const [isSemanticSearching, setIsSemanticSearching] = useState(false)
  
  // Semantic search simulation (in real app, this would call your embedding API)
  const handleSemanticSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setIsSemanticSearching(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple semantic matching simulation - in real app this would use embeddings
    const keywords = query.toLowerCase().split(' ')
    const results = datasets.filter(dataset => {
      const searchText = `${dataset.name} ${dataset.description} ${dataset.tags.join(' ')}`.toLowerCase()
      return keywords.some(keyword => searchText.includes(keyword))
    })
    
    setIsSemanticSearching(false)
    // For now, just update the search query to show filtered results
    setSearchQuery(query)
  }, [])

  // Filter datasets based on search and filters
  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => {
      // Text search
      const matchesSearch = searchQuery === "" || 
        dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Category filter
      const matchesCategory = selectedCategory === "All" || dataset.category === selectedCategory
      
      // Usage filter  
      const matchesUsage = selectedUsage === "All" || dataset.usage.toLowerCase() === selectedUsage.toLowerCase()
      
      return matchesSearch && matchesCategory && matchesUsage
    })
  }, [searchQuery, selectedCategory, selectedUsage])

  const getQualityColor = (quality: number) => {
    if (quality >= 0.9) return "text-green-600 bg-green-100"
    if (quality >= 0.8) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getUsageColor = (usage: string) => {
    switch (usage.toLowerCase()) {
      case "high": return "text-red-600 bg-red-100"
      case "medium": return "text-yellow-600 bg-yellow-100"
      case "low": return "text-green-600 bg-green-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Explorer</h1>
              <p className="text-gray-600 mt-1">Explore, filter, and analyze individual datasets with advanced search capabilities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/data-catalog">
                  <Database className="h-4 w-4 mr-2" />
                  Catalog View
                </Link>
              </Button>
              <Button asChild>
                <Link href="/chat">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Query
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters and Search */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Regular Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Datasets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, description, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Semantic Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Semantic Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Describe what you're looking for..."
                    value={semanticSearchQuery}
                    onChange={(e) => setSemanticSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSemanticSearch(semanticSearchQuery)
                      }
                    }}
                  />
                  <Button 
                    onClick={() => handleSemanticSearch(semanticSearchQuery)}
                    disabled={isSemanticSearching || !semanticSearchQuery.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {isSemanticSearching ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Semantic Search
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="space-y-1">
                    <div>Try: "financial data with supplier info"</div>
                    <div>Or: "budget planning datasets"</div>
                    <div>Or: "contract management data"</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Usage Level</label>
                  <Select value={selectedUsage} onValueChange={setSelectedUsage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {usageTypes.map(usage => (
                        <SelectItem key={usage} value={usage}>{usage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedCategory !== "All" || selectedUsage !== "All" || searchQuery) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory("All")
                      setSelectedUsage("All")
                      setSearchQuery("")
                      setSemanticSearchQuery("")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Datasets:</span>
                  <span className="font-medium">{datasets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered Results:</span>
                  <span className="font-medium">{filteredDatasets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-medium">
                    {filteredDatasets.reduce((sum, d) => sum + d.recordCount, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9">
            {selectedDataset ? (
              /* Dataset Detail View */
              <div className="space-y-6">
                {/* Dataset Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDataset(null)}
                          className="mb-2"
                        >
                          ← Back to Datasets
                        </Button>
                        <CardTitle className="text-2xl">{selectedDataset.name}</CardTitle>
                        <p className="text-gray-600">{selectedDataset.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/chat?query=Analyze ${selectedDataset.name}&dataset=${selectedDataset.id}`}>
                            <Brain className="h-4 w-4 mr-2" />
                            Query with AI
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Records:</span>
                        <div className="font-medium">{selectedDataset.recordCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <div className="font-medium">{selectedDataset.size}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality:</span>
                        <div className={`font-medium px-2 py-1 rounded text-xs ${getQualityColor(selectedDataset.quality)}`}>
                          {(selectedDataset.quality * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Updated:</span>
                        <div className="font-medium">{selectedDataset.lastUpdated}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dataset Tabs */}
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Data Preview</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Sample Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(selectedDataset.preview[0]).map(key => (
                                  <TableHead key={key} className="font-semibold">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedDataset.preview.map((row, index) => (
                                <TableRow key={index}>
                                  {Object.values(row).map((value, cellIndex) => (
                                    <TableCell key={cellIndex}>
                                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 text-center">
                          Showing first 3 rows of {selectedDataset.recordCount.toLocaleString()} total records
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="schema" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Column Schema</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Column Name</TableHead>
                                <TableHead>Data Type</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedDataset.schema.columns.map((column, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{column}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{selectedDataset.schema.types[index]}</Badge>
                                  </TableCell>
                                  <TableCell className="text-gray-600">
                                    {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Dataset Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span>Dataset ID:</span>
                            <span className="font-medium">{selectedDataset.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Owner:</span>
                            <span className="font-medium">{selectedDataset.owner}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span className="font-medium">{selectedDataset.format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Category:</span>
                            <Badge>{selectedDataset.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Tags & Usage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-600 block mb-2">Tags:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedDataset.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Usage Level:</span>
                            <Badge className={`ml-2 text-xs ${getUsageColor(selectedDataset.usage)}`}>
                              {selectedDataset.usage}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              /* Dataset List View with Enhanced Data Table */
              <div className="space-y-6">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {filteredDatasets.length} Dataset{filteredDatasets.length !== 1 ? 's' : ''} Found
                    </h2>
                    {searchQuery && (
                      <p className="text-gray-600 text-sm">
                        Results for "{searchQuery}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/chat">
                        <Brain className="h-4 w-4 mr-2" />
                        Query with AI
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Enhanced Data Table */}
                {filteredDatasets.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
                      <p className="text-gray-600 mb-4">
                        Try adjusting your search terms or filters to find relevant datasets.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedCategory("All")
                          setSelectedUsage("All")
                          setSearchQuery("")
                          setSemanticSearchQuery("")
                        }}
                      >
                        Clear all filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="overflow-hidden shadow-lg border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-gray-600" />
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Data Explorer ({filteredDatasets.length} datasets)
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          Enterprise Catalog
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <EnhancedDataTable
                        columns={dataTableColumns}
                        data={filteredDatasets}
                        searchKey="name"
                        placeholder="Search datasets by name, description, or tags..."
                        filterableColumns={dataTableFilterOptions}
                        enableRowSelection={true}
                        enableColumnVisibility={true}
                        enableExport={true}
                        exportFileName="dataset-catalog"
                        onRowClick={(dataset) => {
                          setSelectedDataset(dataset)
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}