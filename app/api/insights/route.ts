import { type NextRequest, NextResponse } from "next/server"

// Mock insights data
const mockInsights = [
  {
    id: "1",
    title: "Supplier Concentration Risk",
    description:
      "ILENSYS TECHNOLOGIES will likely exceed 20% spend concentration by Q2 2025, requiring immediate diversification",
    impact: "$3.94M at risk",
    confidence: 87,
    status: "pending",
    priority: "High",
    costCenter: "R&D Engineering",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/25/2025",
    notes: "Immediate action required: Identify backup suppliers",
    category: "ILENSYS TECHNOLOGIES",
    suppliers: "Professional Services",
    spend: "$855,340",
    savings: "15.4%",
    target: "Dual-source immediately",
  },
  {
    id: "2",
    title: "Professional Services Consolidation",
    description: "Consolidating 47 professional service suppliers to 20 will generate $850K savings within 6 months",
    impact: "$850K potential savings",
    confidence: 92,
    status: "approved",
    priority: "High",
    costCenter: "IT Operations",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/23/2025",
    notes: "No notes",
    category: "CYIENT INC",
    suppliers: "Professional Services",
    spend: "$421,230",
    savings: "9.9%",
    target: "Backup supplier needed",
  },
  {
    id: "3",
    title: "Contract Terms Optimization",
    description: "Negotiating payment terms from 45 to 30 days will improve cash flow by $605K annually",
    impact: "$605K cash flow improvement",
    confidence: 74,
    status: "pending",
    priority: "Medium",
    costCenter: "Finance",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/25/2025",
    notes: "No notes",
    category: "KINAXIS CORP",
    suppliers: "Material Handling",
    spend: "$191,450",
    savings: "4.5%",
    target: "Standardize equipment",
  },
  {
    id: "4",
    title: "Geographic Concentration Risk",
    description: "Supply chain disruption probability will increase 40% if Southeast concentration exceeds 70%",
    impact: "$8.95M supply chain risk",
    confidence: 89,
    status: "approved",
    priority: "Medium",
    costCenter: "Manufacturing",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/19/2025",
    notes: "No notes",
    category: "SCOTT HAYNIE TRUCKING",
    suppliers: "Freight/3PL",
    spend: "$182,940",
    savings: "4.3%",
    target: "Regional alternatives",
  },
  {
    id: "5",
    title: "Small Transaction Inefficiency",
    description: "Implementing P-card program for transactions under $1K will reduce processing costs by $105K",
    impact: "$105K processing cost",
    confidence: 81,
    status: "pending",
    priority: "Low",
    costCenter: "Procurement",
    source: "AI",
    dataSource: "Coupa",
    updated: "8/23/2025",
    notes: "No notes",
    category: "Multiple Suppliers",
    suppliers: "Various",
    spend: "$105,000",
    savings: "8.1%",
    target: "Process improvement",
  },
  {
    id: "6",
    title: "Q4 Spend Surge Analysis",
    description: "Q1 2025 budget allocation adjustments will prevent 37% Q4 spending surge recurrence",
    impact: "$2.1M budget optimization",
    confidence: 78,
    status: "approved",
    priority: "Medium",
    costCenter: "Finance",
    source: "Team",
    dataSource: "Coupa",
    updated: "8/16/2025",
    notes: "No notes",
    category: "Budget Planning",
    suppliers: "All Categories",
    spend: "$2,100,000",
    savings: "+12.3%",
    target: "Optimization opportunities",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  let filteredInsights = mockInsights

  if (status && status !== "all") {
    filteredInsights = mockInsights.filter((insight) => insight.status === status)
  }

  return NextResponse.json({ insights: filteredInsights })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { id, status, notes } = body

  // Simulate updating insight status
  const insight = mockInsights.find((i) => i.id === id)
  if (insight) {
    insight.status = status
    if (notes) insight.notes = notes
  }

  return NextResponse.json({ success: true, insight })
}
