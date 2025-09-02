import { type NextRequest, NextResponse } from "next/server"

const mockUserSettings = {
  profile: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@agenticlabs.io",
    department: "Procurement",
    primaryCostCenter: "R&D Engineering",
  },
  regional: {
    timezone: "Eastern Time (ET)",
    language: "English",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "1,234.56 (US)",
  },
  notifications: {
    emailAlerts: true,
    insightUpdates: true,
    weeklyReports: false,
    systemMaintenance: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: "8 hours",
    lastPasswordChange: "2024-06-15",
  },
  appearance: {
    theme: "light",
    compactMode: false,
    showAdvancedFeatures: true,
  },
  governance: {
    dataRetention: "7 years",
    auditLogging: true,
    complianceReporting: true,
  },
}

export async function GET() {
  return NextResponse.json({ settings: mockUserSettings })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { section, data } = body

  // Simulate updating settings
  if (mockUserSettings[section as keyof typeof mockUserSettings]) {
    Object.assign(mockUserSettings[section as keyof typeof mockUserSettings], data)
  }

  return NextResponse.json({ success: true, settings: mockUserSettings })
}
