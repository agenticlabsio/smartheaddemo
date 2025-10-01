import { type NextRequest, NextResponse } from "next/server"

const mockUserSettings = {
  profile: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@agenticlabs.io",
    department: "Facilities Management",
    costCenter: "Manufacturing Operations",
    timezone: "Eastern Time (ET)",
  },
  locationFacility: {
    facility: "Asheville Manufacturing Facility",
    facilityAddress: "123 Industrial Blvd, Asheville, NC 28801",
    facilityTimezone: "Eastern Time (ET)",
    regionalSettings: "US East Coast",
    datasetValue: "86.6M", // Reference to the transaction dataset
  },
  chatPreferences: {
    defaultMode: "Analyst",
    analysisDepth: "Detailed",
    responseFormat: "Conversational",
    followUpSuggestions: true,
  },
  dataAnalytics: {
    dataSource: "Combined",
    visualizationStyle: "Mixed",
    evidenceDetailLevel: "Standard",
    showConfidenceScores: true,
  },
  userPersonalization: {
    compactMode: false,
    showAdvancedFeatures: true,
    enableInsightAlerts: true,
    enableSystemNotifications: true,
    sessionTimeout: "8 hours",
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
