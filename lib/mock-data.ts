// Centralized mock data for the ProcureIQ platform
export const procurementMetrics = {
  totalSpend: 52300000, // $52.3M
  suppliers: 1247,
  facilities: 4,
  costCenters: 12,
  activeContracts: 847,
  pendingApprovals: 23,
  riskAlerts: 5,
  savingsOpportunities: 2100000, // $2.1M
}

export const supplierData = [
  {
    name: "ILENSYS TECHNOLOGIES",
    spend: 855340,
    percentage: 15.4,
    category: "Professional Services",
    riskLevel: "High",
    contracts: 3,
  },
  {
    name: "CYIENT INC",
    spend: 421230,
    percentage: 9.9,
    category: "Professional Services",
    riskLevel: "Medium",
    contracts: 2,
  },
  {
    name: "KINAXIS CORP",
    spend: 191450,
    percentage: 4.5,
    category: "Material Handling",
    riskLevel: "Low",
    contracts: 1,
  },
  {
    name: "SCOTT HAYNIE TRUCKING",
    spend: 182940,
    percentage: 4.3,
    category: "Freight/3PL",
    riskLevel: "Medium",
    contracts: 4,
  },
]

export const facilityData = [
  {
    name: "Manufacturing Hub Alpha",
    location: "Phoenix, AZ", // Updated from Asheville, NC to Phoenix, AZ
    spend: 30300000,
    percentage: 58,
    suppliers: 423,
    riskLevel: "Medium",
  },
  {
    name: "Distribution Center Beta",
    location: "Tempe, AZ", // Updated from Charlotte, NC to Tempe, AZ for consistency
    spend: 12100000,
    percentage: 23,
    suppliers: 234,
    riskLevel: "Low",
  },
  {
    name: "Innovation Campus Gamma",
    location: "Scottsdale, AZ", // Updated from Raleigh, NC to Scottsdale, AZ for consistency
    spend: 9900000,
    percentage: 19,
    suppliers: 156,
    riskLevel: "Low",
  },
]

export const costCenterData = [
  { name: "R&D Engineering", spend: 18500000, percentage: 35.4 },
  { name: "Manufacturing Operations", spend: 12200000, percentage: 23.3 },
  { name: "IT Operations", spend: 8900000, percentage: 17.0 },
  { name: "Facilities Management", spend: 6700000, percentage: 12.8 },
  { name: "Quality Assurance", spend: 3200000, percentage: 6.1 },
  { name: "Finance", spend: 2800000, percentage: 5.4 },
]

export const riskCategories = [
  {
    category: "Supplier Concentration",
    level: "High",
    impact: 3940000,
    description: "Top 10 suppliers control 51.7% of spend",
  },
  {
    category: "Geographic Concentration",
    level: "Medium",
    impact: 8950000,
    description: "67.3% suppliers in Southeast region",
  },
  {
    category: "Contract Compliance",
    level: "Low",
    impact: 450000,
    description: "3% contracts require renewal within 90 days",
  },
]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
