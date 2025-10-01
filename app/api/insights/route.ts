import { type NextRequest, NextResponse } from "next/server"

// Updated insights data from attached file
const mockInsights = [
  {
    id: "1",
    title: "Cost Center Spend Variance Analysis",
    description: "Cost center spend variance analysis reveals extreme volatility with coefficient of variation ranging from 0.24 to 2.67 across 128 centers. Top 10 centers control 64% of spend but show inconsistent patterns indicating budget management failures and operational inefficiencies.",
    impact: "$33.9M at risk",
    confidence: 95,
    status: "pending",
    priority: "Critical",
    costCenter: "Multiple Centers",
    source: "AI",
    dataSource: "Financial Data",
    updated: "2025-09-05",
    notes: "30 extreme-variance centers consume 69.5% of total spend with unpredictable patterns",
    category: "Variance Analysis",
    suppliers: "Various",
    spend: "$33,916,308",
    savings: "Budget Control",
    target: "Implement variance monitoring"
  },
  {
    id: "2", 
    title: "Quarterly Trend Analysis",
    description: "Quarterly trend analysis shows dramatic -53% YoY decline with Q3 2024 representing inflection point. Predictive models indicate spending normalization by Q2 2025 with 12% quarterly growth expected.",
    impact: "-53% YoY decline",
    confidence: 92,
    status: "approved",
    priority: "Critical",
    costCenter: "All Operations",
    source: "AI",
    dataSource: "Financial Data",
    updated: "2025-09-05",
    notes: "Q1-Q3 2025 showing -34% and -64% sequential declines",
    category: "Quarterly Analysis",
    suppliers: "All Categories",
    spend: "$1,388,710",
    savings: "Strategic Review",
    target: "Establish spend floors"
  },
  {
    id: "3",
    title: "Account Spend Concentration Analysis", 
    description: "Account spend analysis reveals extreme concentration: top 5 accounts control $23.9M (49%) of total spend. Professional Fees account alone represents $7.3M (15%) creating single-point failure risk.",
    impact: "$23.9M concentration risk",
    confidence: 88,
    status: "pending",
    priority: "High",
    costCenter: "Professional Services",
    source: "AI", 
    dataSource: "Financial Data",
    updated: "2025-09-05",
    notes: "Professional Fees and Consultants represent 27.6% of total spend",
    category: "Account Analysis",
    suppliers: "Professional Services",
    spend: "$7,328,054",
    savings: "Vendor Diversification",
    target: "Implement 60/25/15 split"
  },
  {
    id: "4",
    title: "Yearly Spending Trajectory",
    description: "Yearly spending trajectory shows severe contraction: 2024 spend declined -53.1% vs 2023. Current 2025 run-rate indicates further -67% decline creating budget crisis by year-end.",
    impact: "-67% decline trajectory",
    confidence: 89,
    status: "approved", 
    priority: "Critical",
    costCenter: "Strategic Planning",
    source: "AI",
    dataSource: "Financial Data", 
    updated: "2025-09-05",
    notes: "R&D cuts of 72% suggest reduced innovation investment",
    category: "Trajectory Analysis",
    suppliers: "All Categories",
    spend: "$9,306,842",
    savings: "Strategic Protection",
    target: "Protect R&D spending"
  },
  {
    id: "5",
    title: "Entity Spend Efficiency Analysis",
    description: "Entity spend efficiency analysis reveals 3.2x variance in spend-per-outcome across 8 entities. LEAsheville shows superior efficiency while Tiger entities lag significantly in procurement practices.",
    impact: "3.2x efficiency variance",
    confidence: 84,
    status: "pending",
    priority: "High", 
    costCenter: "Procurement Operations",
    source: "AI",
    dataSource: "Financial Data",
    updated: "2025-09-05", 
    notes: "LEAshevilleSVC achieving $1.25M spend per cost center vs $78K for Tiger entities",
    category: "Efficiency Analysis",
    suppliers: "Multiple Vendors",
    spend: "$2,493,624",
    savings: "15-25% cost reduction",
    target: "Standardize procurement practices"
  },
  {
    id: "6",
    title: "Advanced Time Series Forecasting",
    description: "Advanced time series analysis with confidence intervals predicts $42.8M annual run-rate by 2026. Current trajectory shows 73% confidence of continued decline without intervention.",
    impact: "$42.8M forecast variance",
    confidence: 73,
    status: "approved",
    priority: "Medium",
    costCenter: "Financial Planning", 
    source: "AI",
    dataSource: "Financial Data",
    updated: "2025-09-05",
    notes: "Wide confidence intervals suggest high uncertainty requiring scenario planning",
    category: "Forecasting",
    suppliers: "All Categories",
    spend: "$13,964,126", 
    savings: "Scenario Planning",
    target: "Three-scenario budget planning"
  },
  {
    id: "7",
    title: "Account-Level Pricing Variance",
    description: "Account-level pricing variance reveals systematic $2.7M overpayment across entities. Same accounts show 5x-47x price differences between entities indicating contract management failure.",
    impact: "$2.7M overpayment opportunity",
    confidence: 91,
    status: "pending",
    priority: "Critical",
    costCenter: "Contract Management",
    source: "AI",
    dataSource: "Financial Data",
    updated: "2025-09-05",
    notes: "Entities paying 38x different rates for identical services",
    category: "Pricing Analysis", 
    suppliers: "Professional Services",
    spend: "$1,169,986",
    savings: "$500K+ annual savings",
    target: "Centralized contract negotiation"
  }
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