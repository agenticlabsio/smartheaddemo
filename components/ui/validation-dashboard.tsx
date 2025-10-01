'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Activity, Shield, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValidationMetrics {
  overallAccuracy: number
  confidenceScore: number
  errorsDetected: number
  correctionsApplied: number
  validationCount: number
  successRate: number
  criticalIssues: number
  lastValidation: string
}

interface ValidationError {
  id: string
  type: 'calculation' | 'format' | 'range' | 'business_logic'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  field: string
  timestamp: string
  resolved: boolean
}

interface ValidationDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ValidationDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: ValidationDashboardProps) {
  const [metrics, setMetrics] = useState<ValidationMetrics>({
    overallAccuracy: 0,
    confidenceScore: 0,
    errorsDetected: 0,
    correctionsApplied: 0,
    validationCount: 0,
    successRate: 0,
    criticalIssues: 0,
    lastValidation: ''
  })

  const [recentErrors, setRecentErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadValidationData = async () => {
    setIsLoading(true)
    try {
      // Simulate loading validation data - would connect to actual validation service
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API calls
      setMetrics({
        overallAccuracy: 87.5,
        confidenceScore: 0.82,
        errorsDetected: 23,
        correctionsApplied: 18,
        validationCount: 156,
        successRate: 94.2,
        criticalIssues: 2,
        lastValidation: new Date().toISOString()
      })

      setRecentErrors([
        {
          id: '1',
          type: 'calculation',
          severity: 'critical',
          message: 'SUM aggregation returned $0.0M instead of expected $4.06M',
          field: 'total_amount',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'format',
          severity: 'high',
          message: 'Currency parsing failed for value "($1,234.56)"',
          field: 'amount',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          resolved: true
        },
        {
          id: '3',
          type: 'range',
          severity: 'medium',
          message: 'Value $50,000,000 exceeds expected range for supplier spend',
          field: 'supplier_total',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          resolved: false
        }
      ])

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load validation data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadValidationData()
    
    if (autoRefresh) {
      const interval = setInterval(loadValidationData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.8) return 'text-blue-600'
    if (score >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600'
    if (accuracy >= 90) return 'text-blue-600'
    if (accuracy >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Data Validation Dashboard</h2>
          <p className="text-gray-600">Real-time monitoring of data accuracy and validation metrics</p>
        </div>
        <Button
          onClick={loadValidationData}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getAccuracyColor(metrics.overallAccuracy)}>
                {metrics.overallAccuracy.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.overallAccuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.validationCount} validations performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getConfidenceColor(metrics.confidenceScore)}>
                {(metrics.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={metrics.confidenceScore * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on validation algorithms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={metrics.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}>
                {metrics.criticalIssues}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.errorsDetected} total errors detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Corrections</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.correctionsApplied}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((metrics.correctionsApplied / Math.max(1, metrics.errorsDetected)) * 100).toFixed(0)}% auto-correction rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Validation Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Validation Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No recent validation issues</p>
              <p className="text-sm">All financial data validations are passing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentErrors.map((error) => (
                <div
                  key={error.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    error.resolved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(error.severity) as any}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{error.type}</Badge>
                          <span className="text-sm text-gray-500">
                            Field: {error.field}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">{error.message}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(error.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {error.resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Success Rate</h4>
              <div className="text-3xl font-bold text-green-600">
                {metrics.successRate.toFixed(1)}%
              </div>
              <Progress value={metrics.successRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Error Detection</h4>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.errorsDetected}
              </div>
              <p className="text-sm text-gray-600">Total errors found and flagged</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Last Updated</h4>
              <div className="text-sm font-medium text-gray-900">
                {lastRefresh.toLocaleTimeString()}
              </div>
              <p className="text-sm text-gray-600">
                Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Validation Components</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Currency Parser</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aggregation Validator</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Handler</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence Scoring</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Data Sources</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Coupa Financial Data</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Baan Procurement Data</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Validation Middleware</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}