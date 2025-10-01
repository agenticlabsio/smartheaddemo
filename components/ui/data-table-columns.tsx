"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Eye,
  ExternalLink,
  Database,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Filter,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Brain
} from "lucide-react"
import Link from "next/link"

export type Dataset = {
  id: string
  name: string
  description: string
  category: string
  recordCount: number
  lastUpdated: string
  size: string
  format: string
  tags: string[]
  quality: number
  usage: string
  owner: string
  schema: {
    columns: string[]
    types: string[]
  }
  preview: any[]
  totalValue?: number
  dateRange?: string
  uniqueEntities?: number
  uniqueCostGroups?: number
  uniqueSuppliers?: number
  uniqueCommodities?: number
}

export const dataTableFilterOptions = [
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Financial", value: "Financial" },
      { label: "Procurement", value: "Procurement" },
      { label: "Analytics", value: "Analytics" },
      { label: "Operations", value: "Operations" }
    ]
  },
  {
    id: "usage",
    title: "Usage Level",
    options: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" }
    ]
  },
  {
    id: "quality",
    title: "Data Quality",
    options: [
      { label: "Excellent (90%+)", value: "excellent" },
      { label: "Good (80-89%)", value: "good" },
      { label: "Fair (70-79%)", value: "fair" },
      { label: "Poor (<70%)", value: "poor" }
    ]
  },
  {
    id: "format",
    title: "Format",
    options: [
      { label: "PostgreSQL", value: "PostgreSQL" },
      { label: "PostgreSQL View", value: "PostgreSQL View" },
      { label: "CSV", value: "CSV" },
      { label: "JSON", value: "JSON" }
    ]
  }
]

export const dataTableColumns: ColumnDef<Dataset>[] = [
  {
    accessorKey: "name",
    header: "Dataset",
    cell: ({ row }) => {
      const dataset = row.original
      return (
        <div className="flex items-start gap-3 min-w-[280px]">
          <div className="flex-shrink-0 mt-1">
            {dataset.category === 'Financial' && <DollarSign className="h-5 w-5 text-green-600" />}
            {dataset.category === 'Procurement' && <Building className="h-5 w-5 text-blue-600" />}
            {dataset.category === 'Analytics' && <BarChart3 className="h-5 w-5 text-purple-600" />}
            {dataset.category === 'Operations' && <Activity className="h-5 w-5 text-orange-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 mb-1 truncate">{dataset.name}</div>
            <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{dataset.description}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {dataset.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {dataset.format}
              </Badge>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "recordCount",
    header: "Data Volume",
    cell: ({ row }) => {
      const dataset = row.original
      return (
        <div className="space-y-2 min-w-[140px]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-semibold text-sm">{dataset.recordCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">records</div>
            </div>
          </div>
          <div className="text-xs">
            <div className="text-gray-500">Size: <span className="font-medium text-gray-700">{dataset.size}</span></div>
            {dataset.totalValue && (
              <div className="text-gray-500">Value: <span className="font-medium text-green-600">${(dataset.totalValue / 1000000).toFixed(1)}M</span></div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "quality",
    header: "Quality & Usage",
    cell: ({ row }) => {
      const dataset = row.original
      const qualityPercentage = Math.round(dataset.quality * 100)
      
      const getQualityColor = (quality: number) => {
        if (quality >= 90) return "text-green-600 bg-green-100 border-green-300"
        if (quality >= 80) return "text-yellow-600 bg-yellow-100 border-yellow-300"
        return "text-red-600 bg-red-100 border-red-300"
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
        <div className="space-y-2 min-w-[140px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <Badge variant="outline" className={`text-xs border ${getQualityColor(qualityPercentage)}`}>
                {qualityPercentage}% Quality
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <Badge variant="outline" className={`text-xs ${getUsageColor(dataset.usage)}`}>
              {dataset.usage.charAt(0).toUpperCase() + dataset.usage.slice(1)} Usage
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Owner: <span className="font-medium text-gray-700">{dataset.owner}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "schema",
    header: "Schema Details",
    cell: ({ row }) => {
      const dataset = row.original
      return (
        <div className="space-y-2 min-w-[160px]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <span className="font-semibold">{dataset.schema.columns.length}</span>
              <span className="text-gray-600 ml-1">columns</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {dataset.schema.types.slice(0, 3).map((type, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
            {dataset.schema.types.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{dataset.schema.types.length - 3}
              </Badge>
            )}
          </div>
          {(dataset.uniqueEntities || dataset.uniqueSuppliers) && (
            <div className="text-xs text-gray-600">
              {dataset.uniqueEntities && <div>Entities: {dataset.uniqueEntities}</div>}
              {dataset.uniqueSuppliers && <div>Suppliers: {dataset.uniqueSuppliers}</div>}
              {dataset.uniqueCommodities && <div>Commodities: {dataset.uniqueCommodities}</div>}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "lastUpdated",
    header: "Timeline",
    cell: ({ row }) => {
      const dataset = row.original
      const updatedDate = new Date(dataset.lastUpdated)
      const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return (
        <div className="space-y-2 min-w-[120px]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <div className="font-medium">{updatedDate.toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">
                {daysSinceUpdate === 0 ? 'Today' : `${daysSinceUpdate} days ago`}
              </div>
            </div>
          </div>
          {dataset.dateRange && (
            <div className="text-xs text-gray-600">
              <div className="font-medium">Data Range:</div>
              <div className="text-gray-500">{dataset.dateRange}</div>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "tags",
    header: "Tags & Categories",
    cell: ({ row }) => {
      const dataset = row.original
      return (
        <div className="min-w-[180px]">
          <div className="flex flex-wrap gap-1">
            {dataset.tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dataset.tags.length > 4 && (
              <Badge variant="outline" className="text-xs bg-gray-100">
                +{dataset.tags.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const dataset = row.original
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // This would open the dataset detail view
              // For now, we'll scroll to it or open in a modal
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button size="sm" asChild>
            <Link href={`/chat?query=Analyze ${dataset.name}&dataset=${dataset.id}`}>
              <Brain className="h-4 w-4 mr-1" />
              Query
            </Link>
          </Button>
        </div>
      )
    },
  },
]