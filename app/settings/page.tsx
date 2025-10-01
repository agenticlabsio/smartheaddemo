'use client'

import React, { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { Sidebar } from '@/components/ui/sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Settings,
  User,
  LogOut,
  Shield,
  Bell,
  Palette,
  Database,
  Key,
  Mail,
  Calendar,
  Check,
  Save,
  MessageCircle,
  Play,
  MapPin,
  Building,
  MessageSquare,
  Brain,
  BarChart,
  TrendingUp,
  Monitor,
  Target,
  PieChart,
  ToggleLeft,
  Star,
  Eye,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Smith", 
    email: user?.primaryEmailAddress?.emailAddress || "john.smith@agenticlabs.io",
    department: "Facilities Management",
    costCenter: "Manufacturing Operations",
    timezone: "Eastern Time (ET)",
    // Location & Facility
    facility: "Asheville Manufacturing Facility",
    facilityAddress: "123 Industrial Blvd, Asheville, NC 28801",
    facilityTimezone: "Eastern Time (ET)",
    regionalSettings: "US East Coast",
    // Chat Preferences
    defaultMode: "Analyst",
    analysisDepth: "Detailed",
    responseFormat: "Conversational",
    followUpSuggestions: true,
    // Data & Analytics
    dataSource: "Combined",
    visualizationStyle: "Mixed",
    evidenceDetailLevel: "Standard",
    showConfidenceScores: true,
    // User Personalization
    compactMode: false,
    showAdvancedFeatures: true,
    enableInsightAlerts: true,
    enableSystemNotifications: true,
    sessionTimeout: "8 hours"
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          const { settings } = data
          
          // Update form data with loaded settings
          setFormData(prev => ({
            ...prev,
            firstName: settings.profile?.firstName || prev.firstName,
            lastName: settings.profile?.lastName || prev.lastName,
            email: settings.profile?.email || prev.email,
            department: settings.profile?.department || prev.department,
            costCenter: settings.profile?.costCenter || prev.costCenter,
            timezone: settings.profile?.timezone || prev.timezone,
            facility: settings.locationFacility?.facility || prev.facility,
            facilityAddress: settings.locationFacility?.facilityAddress || prev.facilityAddress,
            facilityTimezone: settings.locationFacility?.facilityTimezone || prev.facilityTimezone,
            regionalSettings: settings.locationFacility?.regionalSettings || prev.regionalSettings,
            defaultMode: settings.chatPreferences?.defaultMode || prev.defaultMode,
            analysisDepth: settings.chatPreferences?.analysisDepth || prev.analysisDepth,
            responseFormat: settings.chatPreferences?.responseFormat || prev.responseFormat,
            followUpSuggestions: settings.chatPreferences?.followUpSuggestions ?? prev.followUpSuggestions,
            dataSource: settings.dataAnalytics?.dataSource || prev.dataSource,
            visualizationStyle: settings.dataAnalytics?.visualizationStyle || prev.visualizationStyle,
            evidenceDetailLevel: settings.dataAnalytics?.evidenceDetailLevel || prev.evidenceDetailLevel,
            showConfidenceScores: settings.dataAnalytics?.showConfidenceScores ?? prev.showConfidenceScores,
            compactMode: settings.userPersonalization?.compactMode ?? prev.compactMode,
            showAdvancedFeatures: settings.userPersonalization?.showAdvancedFeatures ?? prev.showAdvancedFeatures,
            enableInsightAlerts: settings.userPersonalization?.enableInsightAlerts ?? prev.enableInsightAlerts,
            enableSystemNotifications: settings.userPersonalization?.enableSystemNotifications ?? prev.enableSystemNotifications,
            sessionTimeout: settings.userPersonalization?.sessionTimeout || prev.sessionTimeout
          }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setSaveMessage('')
    
    try {
      // Save each section of settings
      const sections = [
        {
          section: 'profile',
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            department: formData.department,
            costCenter: formData.costCenter,
            timezone: formData.timezone
          }
        },
        {
          section: 'locationFacility',
          data: {
            facility: formData.facility,
            facilityAddress: formData.facilityAddress,
            facilityTimezone: formData.facilityTimezone,
            regionalSettings: formData.regionalSettings
          }
        },
        {
          section: 'chatPreferences',
          data: {
            defaultMode: formData.defaultMode,
            analysisDepth: formData.analysisDepth,
            responseFormat: formData.responseFormat,
            followUpSuggestions: formData.followUpSuggestions
          }
        },
        {
          section: 'dataAnalytics',
          data: {
            dataSource: formData.dataSource,
            visualizationStyle: formData.visualizationStyle,
            evidenceDetailLevel: formData.evidenceDetailLevel,
            showConfidenceScores: formData.showConfidenceScores
          }
        },
        {
          section: 'userPersonalization',
          data: {
            compactMode: formData.compactMode,
            showAdvancedFeatures: formData.showAdvancedFeatures,
            enableInsightAlerts: formData.enableInsightAlerts,
            enableSystemNotifications: formData.enableSystemNotifications,
            sessionTimeout: formData.sessionTimeout
          }
        }
      ]

      // Save all sections
      for (const sectionData of sections) {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sectionData)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to save ${sectionData.section} settings`)
        }
      }
      
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage('Failed to save settings. Please try again.')
      setTimeout(() => setSaveMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ redirectUrl: '/' })
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile, account security, and application preferences</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {saveMessage && (
              <span className={`text-sm ${
                saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveMessage}
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Input id="email" value={formData.email} disabled className="bg-muted flex-1" />
                {user?.primaryEmailAddress?.verification?.status === 'verified' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Email managed by your authentication provider</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facilities Management">Facilities Management</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Select
                  value={formData.costCenter}
                  onValueChange={(value) => handleInputChange("costCenter", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manufacturing Operations">Manufacturing Operations</SelectItem>
                    <SelectItem value="Facilities Management">Facilities Management</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eastern Time (ET)">Eastern Time (ET)</SelectItem>
                  <SelectItem value="Central Time (CT)">Central Time (CT)</SelectItem>
                  <SelectItem value="Mountain Time (MT)">Mountain Time (MT)</SelectItem>
                  <SelectItem value="Pacific Time (PT)">Pacific Time (PT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Account Information</Label>
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Member Since:</span>
                    <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Location & Facility</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Primary Facility</span>
              </div>
              <p className="text-sm text-blue-700 mb-2">This facility hosts the $86.6M transaction dataset used for financial analysis and reporting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facility">Facility Name</Label>
                <Input
                  id="facility"
                  value={formData.facility}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Default facility location</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityTimezone">Facility Timezone</Label>
                <Select 
                  value={formData.facilityTimezone} 
                  onValueChange={(value) => handleInputChange("facilityTimezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eastern Time (ET)">Eastern Time (ET)</SelectItem>
                    <SelectItem value="Central Time (CT)">Central Time (CT)</SelectItem>
                    <SelectItem value="Mountain Time (MT)">Mountain Time (MT)</SelectItem>
                    <SelectItem value="Pacific Time (PT)">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityAddress">Facility Address</Label>
              <Input
                id="facilityAddress"
                value={formData.facilityAddress}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regionalSettings">Regional Settings</Label>
              <Select 
                value={formData.regionalSettings} 
                onValueChange={(value) => handleInputChange("regionalSettings", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US East Coast">US East Coast</SelectItem>
                  <SelectItem value="US West Coast">US West Coast</SelectItem>
                  <SelectItem value="US Central">US Central</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chat Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Chat Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultMode">Default Mode</Label>
                <Select 
                  value={formData.defaultMode} 
                  onValueChange={(value) => handleInputChange("defaultMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Analyst">Analyst Mode</SelectItem>
                    <SelectItem value="Executive">Executive Mode</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Analyst provides detailed analysis, Executive gives high-level summaries</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="analysisDepth">Analysis Depth</Label>
                <Select 
                  value={formData.analysisDepth} 
                  onValueChange={(value) => handleInputChange("analysisDepth", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quick">Quick</SelectItem>
                    <SelectItem value="Detailed">Detailed</SelectItem>
                    <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responseFormat">Response Format</Label>
                <Select 
                  value={formData.responseFormat} 
                  onValueChange={(value) => handleInputChange("responseFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conversational">Conversational</SelectItem>
                    <SelectItem value="Structured">Structured</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="followUpSuggestions">Follow-up Suggestions</Label>
                  <input
                    type="checkbox"
                    id="followUpSuggestions"
                    checked={formData.followUpSuggestions}
                    onChange={(e) => handleInputChange("followUpSuggestions", e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Show suggested follow-up questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span>Data & Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source Preference</Label>
                <Select 
                  value={formData.dataSource} 
                  onValueChange={(value) => handleInputChange("dataSource", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coupa">Coupa Only</SelectItem>
                    <SelectItem value="Baan">Baan Only</SelectItem>
                    <SelectItem value="Combined">Combined (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Default data source for analysis</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visualizationStyle">Visualization Style</Label>
                <Select 
                  value={formData.visualizationStyle} 
                  onValueChange={(value) => handleInputChange("visualizationStyle", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Charts">Charts Preferred</SelectItem>
                    <SelectItem value="Tables">Tables Preferred</SelectItem>
                    <SelectItem value="Mixed">Mixed (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evidenceDetailLevel">Evidence Detail Level</Label>
                <Select 
                  value={formData.evidenceDetailLevel} 
                  onValueChange={(value) => handleInputChange("evidenceDetailLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minimal">Minimal</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showConfidenceScores">Show Confidence Scores</Label>
                  <input
                    type="checkbox"
                    id="showConfidenceScores"
                    checked={formData.showConfidenceScores}
                    onChange={(e) => handleInputChange("showConfidenceScores", e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Display confidence indicators for analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Personalization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span>User Personalization</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Interface Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.compactMode}
                      onChange={(e) => handleInputChange("compactMode", e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Advanced Features</Label>
                      <p className="text-xs text-muted-foreground">Show advanced analysis options</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showAdvancedFeatures}
                      onChange={(e) => handleInputChange("showAdvancedFeatures", e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Insight Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notifications for new insights</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableInsightAlerts}
                      onChange={(e) => handleInputChange("enableInsightAlerts", e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Notifications</Label>
                      <p className="text-xs text-muted-foreground">System updates and maintenance</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableSystemNotifications}
                      onChange={(e) => handleInputChange("enableSystemNotifications", e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select 
                  value={formData.sessionTimeout} 
                  onValueChange={(value) => handleInputChange("sessionTimeout", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="4 hours">4 hours</SelectItem>
                    <SelectItem value="8 hours">8 hours</SelectItem>
                    <SelectItem value="12 hours">12 hours</SelectItem>
                    <SelectItem value="24 hours">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Automatic logout after inactivity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Account Security & Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>
            </div>
            <Button variant="outline" size="sm">Update Password</Button>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Enhanced account security</p>
              </div>
              <Button variant="outline" size="sm">Enable 2FA</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h3 className="font-medium text-red-900">Sign Out</h3>
                <p className="text-sm text-red-700">Sign out of your FinSight account</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span>Application Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Database Connection</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">API Access</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Product Demo</h3>
                <p className="text-sm text-blue-700 mb-3">Learn how to use FinSight with our interactive demo</p>
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link href="/product-demo">
                    <Play className="h-4 w-4 mr-2" />
                    View Demo
                  </Link>
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Chat Assistant</h3>
                <p className="text-sm text-gray-700 mb-3">Ask questions and analyze data</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/chat">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Chat
                  </Link>
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Support</h3>
                <p className="text-sm text-gray-700 mb-3">Need help? Contact our support team</p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  )
}