import { type NextRequest, NextResponse } from "next/server"

const mockDataSources = [
  {
    id: "coupa",
    name: "Coupa Platform",
    description: "Procurement transactions",
    status: "Active",
    type: "Procurement Data",
  },
  {
    id: "baan",
    name: "Baan ERP",
    description: "Financial transactions",
    status: "Active",
    type: "Financial Data",
  },
  {
    id: "analytics",
    name: "Analytics Engine",
    description: "Derived metrics",
    status: "Active",
    type: "Analytics Data",
  },
]

const mockTables = [
  {
    id: "procuresmart_chatbot_data",
    name: "tbl_procuresmart_chatbot_data",
    description: "Final consolidated spend data serving as the primary data source for the ProcureSmart AI chatbot",
    records: "10,666",
    columns: "13",
    owner: "Procurement Analytics Team",
    classification: "Internal Business Data",
    updateFrequency: "Daily",
    sourceFile: "finalspendraw.csv",
  },
  {
    id: "baan_cost_center_transactions",
    name: "tbl_baan_cost_center_transactions",
    description: "Comprehensive transaction data from Baan ERP platform capturing cost center and account allocations",
    records: "1,025",
    columns: "44",
    owner: "ERP Systems Team",
    classification: "Financial Data",
    updateFrequency: "Real-time via ETL",
    sourceFile: "BaanPNS.csv",
  },
  {
    id: "coupa_procurement_transactions",
    name: "tbl_coupa_procurement_transactions",
    description: "Coupa platform procurement and overhead spend transactional data for location-based analysis",
    records: "1,143",
    columns: "31",
    owner: "Procurement Operations Team",
    classification: "Procurement Data",
    updateFrequency: "Near Real-time",
    sourceFile: "Coupa2monthnashville.csv",
  },
  {
    id: "integrated_procurement_reconciliation",
    name: "tbl_integrated_procurement_reconciliation",
    description:
      "Merged Baan ERP and Coupa procurement data with invoice-based reconciliation and data quality metrics",
    records: "3,094",
    columns: "50",
    owner: "Data Integration Team",
    classification: "Integrated Business Data",
    updateFrequency: "Daily ETL Process",
    sourceFile: "mergedclpoc2.csv",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (type === "sources") {
    return NextResponse.json({ dataSources: mockDataSources })
  } else if (type === "tables") {
    return NextResponse.json({ tables: mockTables })
  }

  return NextResponse.json({
    dataSources: mockDataSources,
    tables: mockTables,
  })
}
