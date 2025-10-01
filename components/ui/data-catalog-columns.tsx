"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Shield, 
  Clock, 
  Users, 
  ExternalLink,
  Eye,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { SortableHeader } from "@/components/ui/enhanced-data-table"

// Data source interface
export interface DataSource {
  id: number
  name: string
  description: string
  records: string
  status: "Active" | "Inactive" | "Maintenance"
  classification: "Public" | "Internal" | "Confidential" | "Restricted"
  owner: string
  lastUpdated: string
  updateFrequency: "Real-time" | "Daily" | "Weekly" | "Monthly"
  source: string
  tables?: DataTable[]
}

export interface DataTable {
  id: number
  name: string
  description: string
  records: string
  columns: number
  owner: string
  classification: "Public" | "Internal" | "Confidential" | "Restricted"
  lastUpdated: string
  source: string
}

// Status color mapping
const statusColors = {
  "Active": "default",
  "Inactive": "destructive",
  "Maintenance": "secondary"
} as const

// Classification color mapping
const classificationColors = {
  "Public": "default",
  "Internal": "secondary",
  "Confidential": "outline",
  "Restricted": "destructive"
} as const

export const dataSourceColumns: ColumnDef<DataSource>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader title="Data Source" column={column} />,
    cell: ({ row }) => {
      const source = row.original
      
      return (
        <div className="flex items-center space-x-3">
          <Database className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-sm text-gray-900">
              {source.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {source.description}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "records",
    header: ({ column }) => <SortableHeader title="Records" column={column} />,
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">
        {row.getValue("records")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader title="Status" column={column} />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const IconComponent = status === "Active" ? CheckCircle : AlertCircle
      
      return (
        <div className="flex items-center space-x-2">
          <IconComponent className={`h-4 w-4 ${status === "Active" ? "text-green-500" : "text-red-500"}`} />
          <Badge variant={statusColors[status as keyof typeof statusColors]}>
            {status}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "classification",
    header: ({ column }) => <SortableHeader title="Classification" column={column} />,
    cell: ({ row }) => {
      const classification = row.getValue("classification") as string
      
      return (
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-gray-500" />
          <Badge variant={classificationColors[classification as keyof typeof classificationColors]}>
            {classification}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "owner",
    header: ({ column }) => <SortableHeader title="Owner" column={column} />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{row.getValue("owner")}</span>
      </div>
    ),
  },
  {
    accessorKey: "updateFrequency",
    header: ({ column }) => <SortableHeader title="Update Frequency" column={column} />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{row.getValue("updateFrequency")}</span>
      </div>
    ),
  },
  {
    accessorKey: "lastUpdated",
    header: ({ column }) => <SortableHeader title="Last Updated" column={column} />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Activity className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{row.getValue("lastUpdated")}</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const source = row.original
      
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View source:', source.id)}
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/chat?q=${encodeURIComponent(`Show me ${source.name} schema`)}`}
            className="h-8 px-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Query data</span>
          </Button>
        </div>
      )
    },
  },
]

// Filter options for data catalog
export const dataCatalogFilterOptions = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "Active", value: "Active", icon: CheckCircle },
      { label: "Inactive", value: "Inactive", icon: AlertCircle },
      { label: "Maintenance", value: "Maintenance", icon: Clock },
    ],
  },
  {
    id: "classification",
    title: "Classification",
    options: [
      { label: "Public", value: "Public", icon: Shield },
      { label: "Internal", value: "Internal", icon: Shield },
      { label: "Confidential", value: "Confidential", icon: Shield },
      { label: "Restricted", value: "Restricted", icon: Shield },
    ],
  },
  {
    id: "updateFrequency",
    title: "Update Frequency",
    options: [
      { label: "Real-time", value: "Real-time" },
      { label: "Daily", value: "Daily" },
      { label: "Weekly", value: "Weekly" },
      { label: "Monthly", value: "Monthly" },
    ],
  },
]