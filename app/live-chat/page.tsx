"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Phone, Mail, Clock, Users, Zap } from "lucide-react"
import { Navigation } from "@/components/navigation"

const supportTeam = [
  {
    name: "Sarah Chen",
    role: "Procurement Specialist",
    status: "online",
    expertise: "Supplier Management, Risk Analysis",
  },
  {
    name: "Michael Rodriguez",
    role: "Data Analyst",
    status: "online",
    expertise: "Spend Analytics, Reporting",
  },
  {
    name: "Emily Johnson",
    role: "Platform Expert",
    status: "away",
    expertise: "AI Assistant, Platform Configuration",
  },
]

const quickHelp = [
  {
    question: "How do I approve insights?",
    answer:
      "Navigate to Insights Approval and review each recommendation. Click approve or reject based on your assessment.",
    category: "Getting Started",
  },
  {
    question: "What questions can I ask the AI Assistant?",
    answer:
      "Ask about spend patterns, supplier performance, risk factors, or any data-related questions in natural language.",
    category: "AI Assistant",
  },
  {
    question: "How do I set up risk alerts?",
    answer:
      "Go to Settings > Notifications to configure alerts for supplier concentration, geographic risks, and spend thresholds.",
    category: "Risk Management",
  },
  {
    question: "Can I export data and reports?",
    answer:
      "Yes, most views have export options. Look for the download icon in the top-right of data tables and charts.",
    category: "Data Export",
  },
]

export default function LiveChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Live Support & Help</h1>
          <p className="text-muted-foreground text-lg">
            Get instant help from our procurement experts and platform specialists
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="card-enterprise h-[600px] flex flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Live Chat Support</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Support team is online
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    24/7 Available
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-6 bg-muted/20">
                <div className="space-y-4">
                  {/* Welcome Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-card p-3 rounded-lg border max-w-md">
                      <p className="text-sm">
                        Welcome to ProcureIQ support! I'm here to help you with any questions about the platform. What
                        can I assist you with today?
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Support Team • Just now</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-2 ml-11">
                    <Button variant="outline" size="sm">
                      Getting Started Guide
                    </Button>
                    <Button variant="outline" size="sm">
                      AI Assistant Help
                    </Button>
                    <Button variant="outline" size="sm">
                      Data Questions
                    </Button>
                    <Button variant="outline" size="sm">
                      Technical Support
                    </Button>
                  </div>
                </div>
              </CardContent>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send • Typical response time: under 2 minutes
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Support Team */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Support Team
                </CardTitle>
                <CardDescription>Our procurement experts ready to help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {supportTeam.map((member, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="relative">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          member.status === "online" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.expertise}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Options */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle>Other Contact Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Schedule a Call
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Priority Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Help Section */}
        <Card className="mt-8 card-enterprise">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickHelp.map((item, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground">{item.question}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
