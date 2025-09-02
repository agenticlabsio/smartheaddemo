"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Plus, Save, ChevronDown, Settings, TrendingUp, BarChart3, Users, MapPin } from "lucide-react"
import Link from "next/link"
// import { ChatStorage } from "@/lib/chat-storage"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const insights = [
  {
    id: 1,
    title: "Cost Center Variance Analysis",
    description:
      "Q4 2024 surge to $4.08M (+31% vs Q3) driven by Operations Manufacturing and Technology Solutions centers. 4 centers exceed 40% quarterly variance threshold.",
    impact: "$4.08M",
    priority: "High",
    status: "Approved",
    category: "All Cost Centers",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-red-500",
    analysisData: {
      summary:
        "Critical Q4 2024 spending surge across multiple cost centers with Operations Manufacturing leading at $1.23M (+45% vs Q3). Technology Solutions and Innovation Engineering showing similar acceleration patterns. Root cause: Year-end budget execution and project completions. Control Gap: No quarterly spending gates or variance monitoring for major cost centers.",
      dataTable: [
        {
          category: "Operations - Manufacturing",
          q3_2024: "$837,600",
          q4_2024: "$1,231,200",
          variance: "+47%",
          budget_status: "Critical - 108% over",
          risk: "Critical",
        },
        {
          category: "Technology Solutions",
          q3_2024: "$650,400",
          q4_2024: "$967,800",
          variance: "+49%",
          budget_status: "Critical - 112% over",
          risk: "Critical",
        },
        {
          category: "Innovation - Engineering",
          q3_2024: "$554,640",
          q4_2024: "$820,320",
          variance: "+48%",
          budget_status: "High - 95% utilized",
          risk: "High",
        },
        {
          category: "Strategic Projects",
          q3_2024: "$377,520",
          q4_2024: "$547,560",
          variance: "+45%",
          budget_status: "Medium - 89% utilized",
          risk: "Medium",
        },
        {
          category: "Company Total",
          q3_2024: "$3,073,680",
          q4_2024: "$4,077,024",
          variance: "+33%",
          budget_status: "103% over budget",
          risk: "Budget review needed",
        },
      ],
      followUpQuestions: [
        {
          question: "Show month-over-month progression for Operations Manufacturing Q4 2024 spending pattern",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Operations Manufacturing Q4 2024 Monthly Progression</h4>
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b-2 border-gray-300">
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Month</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Monthly Spend</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">MoM Change</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Spend Driver</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Budget Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">October 2024</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$324,120</td>
                    <td class="border border-gray-300 px-4 py-3">-</td>
                    <td class="border border-gray-300 px-4 py-3">Normal operations</td>
                    <td class="border border-gray-300 px-4 py-3 text-green-700">On track</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">November 2024</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$422,160</td>
                    <td class="border border-gray-300 px-4 py-3 text-orange-700 font-semibold">+30%</td>
                    <td class="border border-gray-300 px-4 py-3">Project acceleration</td>
                    <td class="border border-gray-300 px-4 py-3 text-orange-700">Budget pressure</td>
                  </tr>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">December 2024</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$485,640</td>
                    <td class="border border-gray-300 px-4 py-3 text-red-700 font-semibold">+15%</td>
                    <td class="border border-gray-300 px-4 py-3">Year-end execution</td>
                    <td class="border border-gray-300 px-4 py-3 text-red-700 font-semibold">Budget exceeded</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-gray-700">Analysis shows progressive spending acceleration through Q4, with November marking the inflection point where project acceleration began driving budget pressure.</p>
          </div>`,
        },
        {
          question: "Break down Technology Solutions cost center Q4 surge by account category",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Technology Solutions Q4 Account Category Breakdown</h4>
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b-2 border-gray-300">
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Account Category</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Q4 Spend</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Transactions</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">% of Tech Q4</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Variance Driver</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Professional Fees</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$303,720</td>
                    <td class="border border-gray-300 px-4 py-3">89</td>
                    <td class="border border-gray-300 px-4 py-3">31.4%</td>
                    <td class="border border-gray-300 px-4 py-3">Consulting surge</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Consultants</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$244,560</td>
                    <td class="border border-gray-300 px-4 py-3">45</td>
                    <td class="border border-gray-300 px-4 py-3">25.2%</td>
                    <td class="border border-gray-300 px-4 py-3">Project delivery</td>
                  </tr>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">IT Software Expense</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$155,880</td>
                    <td class="border border-gray-300 px-4 py-3">23</td>
                    <td class="border border-gray-300 px-4 py-3">16.1%</td>
                    <td class="border border-gray-300 px-4 py-3">License renewals</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Advertising</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$118,560</td>
                    <td class="border border-gray-300 px-4 py-3">67</td>
                    <td class="border border-gray-300 px-4 py-3">12.2%</td>
                    <td class="border border-gray-300 px-4 py-3">Campaign launch</td>
                  </tr>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Others</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$145,680</td>
                    <td class="border border-gray-300 px-4 py-3">156</td>
                    <td class="border border-gray-300 px-4 py-3">15.1%</td>
                    <td class="border border-gray-300 px-4 py-3">Mixed expenses</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-gray-700">Professional services and consulting represent 56.6% of Technology Solutions Q4 surge, indicating major project delivery initiatives driving the variance.</p>
          </div>`,
        },
        {
          question: "Compare 2024 vs 2023 Q4 spending patterns across top cost centers",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Q4 Spending Patterns: 2024 vs 2023 Comparison</h4>
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b-2 border-gray-300">
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Cost Center</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Q4 2023</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Q4 2024</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">YoY Change</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Pattern Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Operations - Manufacturing</td>
                    <td class="border border-gray-300 px-4 py-3">$820,320</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$1,231,200</td>
                    <td class="border border-gray-300 px-4 py-3 text-red-700 font-semibold">+50%</td>
                    <td class="border border-gray-300 px-4 py-3">Accelerating trend</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Technology Solutions</td>
                    <td class="border border-gray-300 px-4 py-3">$656,160</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$967,800</td>
                    <td class="border border-gray-300 px-4 py-3 text-red-700 font-semibold">+48%</td>
                    <td class="border border-gray-300 px-4 py-3">Project-driven growth</td>
                  </tr>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Innovation - Engineering</td>
                    <td class="border border-gray-300 px-4 py-3">$694,440</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$820,320</td>
                    <td class="border border-gray-300 px-4 py-3 text-orange-700 font-semibold">+18%</td>
                    <td class="border border-gray-300 px-4 py-3">Controlled growth</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Strategic Projects</td>
                    <td class="border border-gray-300 px-4 py-3">$450,720</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$547,560</td>
                    <td class="border border-gray-300 px-4 py-3 text-orange-700 font-semibold">+21%</td>
                    <td class="border border-gray-300 px-4 py-3">Development acceleration</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-gray-700">Year-over-year analysis reveals Operations Manufacturing and Technology Solutions as primary growth drivers, with 48-50% increases indicating significant operational expansion or project acceleration.</p>
          </div>`,
        },
      ],
    },
  },
  {
    id: 2,
    title: "Professional Services Consolidation",
    description:
      "Professional services spending dominates at $4.87M (15% of total), with Consultants adding $4.08M more. Combined $8.95M professional services spend shows 34% YoY growth requiring cost control review.",
    impact: "$8.95M",
    priority: "High",
    status: "Approved",
    category: "All Cost Centers",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-blue-500",
    analysisData: {
      summary:
        "Professional services categories represent $8.95M of total spend with Professional Fees leading at $4.87M. Offshore consultants at $2.78M suggest significant offshore strategy. Average transaction size: $8,270 indicates high-value engagements. Cost Control Gap: 34% growth in professional services without corresponding ROI measurement framework.",
      dataTable: [
        {
          category: "Professional Fees",
          spend_2023: "$1,884,120",
          spend_2024: "$2,519,880",
          growth: "+34%",
          transactions: "456",
          avg_size: "$5,524",
        },
        {
          category: "Consultants",
          spend_2023: "$1,632,240",
          spend_2024: "$2,192,160",
          growth: "+34%",
          transactions: "234",
          avg_size: "$9,368",
        },
        {
          category: "Consultants - Offshore",
          spend_2023: "$1,042,080",
          spend_2024: "$1,484,160",
          growth: "+43%",
          transactions: "189",
          avg_size: "$7,854",
        },
        {
          category: "Combined Professional",
          spend_2023: "$4,558,440",
          spend_2024: "$6,196,200",
          growth: "+36%",
          transactions: "879",
          avg_size: "$7,047",
        },
      ],
      followUpQuestions: [
        {
          question: "Show professional services spend by cost center to identify usage patterns",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Professional Services Spend by Cost Center</h4>
            <p class="text-gray-700">Innovation Engineering leads with $1.63M (26%), Operations Manufacturing $1.32M (21%), Technology Solutions $1.11M (18%). Innovation showing highest growth at 67% YoY indicating product development acceleration.</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2">Key Insights:</h5>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>• Innovation Engineering: 67% YoY growth suggests R&D acceleration</li>
                <li>• Operations Manufacturing: 21% of total professional services spend</li>
                <li>• Technology Solutions: Strategic consulting focus with 18% allocation</li>
                <li>• Combined top 3 centers represent 65% of professional services budget</li>
              </ul>
            </div>
          </div>`,
        },
        {
          question: "Analyze Offshore consultant utilization vs domestic consultant rates",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Offshore vs Domestic Consultant Analysis</h4>
            <p class="text-gray-700">Offshore consultants average $7,854 per engagement vs domestic $9,368 (+19% premium). Volume increased 78% for offshore consultants vs 28% domestic, suggesting cost optimization strategy.</p>
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100 border-b-2 border-gray-300">
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Service Location</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Avg Rate</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Quality Score</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Completion Rate</th>
                    <th class="border border-gray-300 px-4 py-3 text-left font-semibold">Client Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-white border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Offshore</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$89/hour</td>
                    <td class="border border-gray-300 px-4 py-3">3.2/5.0</td>
                    <td class="border border-gray-300 px-4 py-3">76%</td>
                    <td class="border border-gray-300 px-4 py-3">Good</td>
                  </tr>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <td class="border border-gray-300 px-4 py-3">Domestic</td>
                    <td class="border border-gray-300 px-4 py-3 font-medium">$127/hour</td>
                    <td class="border border-gray-300 px-4 py-3">4.1/5.0</td>
                    <td class="border border-gray-300 px-4 py-3">91%</td>
                    <td class="border border-gray-300 px-4 py-3">Excellent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-gray-700">Total cost of ownership analysis shows 23% actual savings after factoring rework and management overhead.</p>
          </div>`,
        },
        {
          question: "Compare quarterly professional services trends and budget seasonality",
          response: `<div class="space-y-4">
            <h4 class="font-semibold text-lg text-gray-900">Quarterly Professional Services Trends</h4>
            <p class="text-gray-700">Q4 consistently shows 45% higher spend than Q1-Q3 average. December surge indicates year-end project delivery pressure. Recommend quarterly spending caps.</p>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2">Seasonality Analysis:</h5>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>• Q1: 18% of annual professional services spend (underutilized)</li>
                <li>• Q2: 22% of annual spend (steady state)</li>
                <li>• Q3: 24% of annual spend (project ramp-up)</li>
                <li>• Q4: 36% of annual spend (delivery surge)</li>
                <li>• December alone represents 18% of annual professional services budget</li>
              </ul>
            </div>
          </div>`,
        },
      ],
    },
  },
  {
    id: 3,
    title: "IT Software Expense Risk",
    description:
      "IT Software Expense shows critical concentration at $2.17M with single-point-of-failure risk. Software spend increased 41% YoY while IT infrastructure costs grew 38% across all centers.",
    impact: "$2.17M",
    priority: "High",
    status: "Approved",
    category: "IT Operations",
    icon: <Users className="h-4 w-4" />,
    color: "bg-red-500",
    analysisData: {
      summary:
        "IT Software Expense concentrated in IT - Portland ($656K) and Digital Platform ($562K) centers. 41% YoY growth indicates digital transformation acceleration but lacks enterprise license optimization. Risk Assessment: Software vendor concentration and renewal timing create budget volatility and negotiation disadvantage.",
      dataTable: [
        {
          cost_center: "IT - Portland",
          software_2023: "$450,840",
          software_2024: "$656,160",
          growth: "+46%",
          licenses: "89",
          risk: "High",
        },
        {
          cost_center: "Digital Platform",
          software_2023: "$377,520",
          software_2024: "$562,320",
          growth: "+49%",
          licenses: "67",
          risk: "High",
        },
        {
          cost_center: "Innovation - Engineering",
          software_2023: "$229,680",
          software_2024: "$303,600",
          growth: "+32%",
          licenses: "45",
          risk: "Medium",
        },
        {
          cost_center: "Operations Manufacturing",
          software_2023: "$155,880",
          software_2024: "$244,560",
          growth: "+57%",
          licenses: "34",
          risk: "Medium",
        },
        {
          cost_center: "Total IT Software",
          software_2023: "$1,339,680",
          software_2024: "$1,922,520",
          growth: "+43%",
          licenses: "258",
          risk: "Enterprise optimization needed",
        },
      ],
      followUpQuestions: [
        "Identify duplicate software licenses across cost centers for consolidation opportunities",
        "Show software renewal concentration by quarter and negotiation leverage",
        "Calculate ROI on software investments by cost center productivity metrics",
      ],
    },
  },
  {
    id: 4,
    title: "Manufacturing Supplies Growth",
    description:
      "Manufacturing supplies spending at $3.86M shows 23% growth with concerning inventory versus consumables ratio. Tools & Fixtures up 34% suggesting equipment maintenance acceleration.",
    impact: "$3.86M",
    priority: "Medium",
    status: "Approved",
    category: "Operations Manufacturing",
    icon: <MapPin className="h-4 w-4" />,
    color: "bg-yellow-500",
    analysisData: {
      summary:
        "Manufacturing supplies total $3.86M with Consumables at $1.98M and Tools & Fixtures at $1.88M. 34% growth in Tools & Fixtures indicates equipment refresh cycle or production expansion. Operational Insight: Higher tools spend vs consumables suggests capital equipment focus over production volume increases.",
      dataTable: [
        {
          category: "Mfg Supplies - Consumables",
          spend_2023: "$820,320",
          spend_2024: "$988,320",
          change: "+21%",
          purchases: "2,456",
          avg_size: "$402",
        },
        {
          category: "Mfg Supplies - Tools & Fixture",
          spend_2023: "$723,600",
          spend_2024: "$967,800",
          change: "+34%",
          purchases: "892",
          avg_size: "$1,085",
        },
        {
          category: "Total Mfg Supplies",
          spend_2023: "$1,543,920",
          spend_2024: "$1,956,120",
          change: "+27%",
          purchases: "3,348",
          avg_size: "$584",
        },
      ],
      followUpQuestions: [
        "Break down manufacturing supplies by cost center to identify production line impacts",
        "Analyze tools vs consumables ratio trend and equipment lifecycle correlation",
        "Compare manufacturing supplies spend efficiency across production cost centers",
      ],
    },
  },
  {
    id: 5,
    title: "Facilities Equipment Strategy",
    description:
      "Facilities expenses showing 28% growth with Building Maintenance at $1.40M and Equipment Leasing at $1.92M. Rent vs purchase analysis needed for equipment strategy.",
    impact: "$3.32M",
    priority: "Medium",
    status: "Approved",
    category: "Facilities",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-yellow-500",
    analysisData: {
      summary:
        "Facilities-related expenses total $3.32M with Equipment Leasing leading at $1.92M. Building Maintenance at $1.40M suggests significant facility investments or deferred maintenance catch-up. Strategic Question: High equipment lease costs vs capital purchase analysis required for long-term cost optimization.",
      dataTable: [
        {
          category: "Leasing - Equipment",
          total_2023: "$760,800",
          total_2024: "$975,120",
          growth: "+28%",
          centers: "Operations, Production",
          impact: "Lease vs buy analysis",
        },
        {
          category: "R & M - Building",
          total_2023: "$554,640",
          total_2024: "$722,880",
          growth: "+30%",
          centers: "Facilities, Maintenance",
          impact: "Facility investment program",
        },
        {
          category: "Combined Facilities",
          total_2023: "$1,315,440",
          total_2024: "$1,698,000",
          growth: "+29%",
          centers: "Mixed centers",
          impact: "Capital strategy review",
        },
      ],
      followUpQuestions: [
        "Calculate lease vs purchase analysis for top equipment leases",
        "Show building maintenance spend by facility and urgency classification",
        "Analyze facilities spend correlation with production volume and capacity utilization",
      ],
    },
  },
  {
    id: 6,
    title: "Marketing Spend Surge",
    description:
      "Marketing and connectivity expenses at $3.22M show 67% surge led by Advertising ($1.91M) and Digital Marketing center ($1.31M). Campaign ROI tracking essential.",
    impact: "$3.22M",
    priority: "High",
    status: "Pending",
    category: "Digital Marketing",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-orange-500",
    analysisData: {
      summary:
        "Marketing investments surged 67% to $3.22M with Advertising leading growth. Digital Marketing center at $1.31M suggests major digital transformation initiative requiring ROI validation. Performance Gap: 67% spend increase without corresponding revenue attribution or conversion tracking systems in place.",
      dataTable: [
        {
          category: "Advertising",
          spend_2023: "$746,280",
          spend_2024: "$1,246,560",
          growth: "+67%",
          campaigns: "234",
          avg_size: "$5,327",
        },
        {
          category: "Digital Marketing",
          spend_2023: "$377,520",
          spend_2024: "$820,320",
          growth: "+117%",
          campaigns: "89",
          avg_size: "$9,217",
        },
        {
          category: "Online Campaigns",
          spend_2023: "$229,680",
          spend_2024: "$480,960",
          growth: "+109%",
          campaigns: "156",
          avg_size: "$3,083",
        },
        {
          category: "Total Marketing",
          spend_2023: "$1,353,480",
          spend_2024: "$2,547,840",
          growth: "+88%",
          campaigns: "479",
          avg_size: "$5,320",
        },
      ],
      followUpQuestions: [
        "Show marketing spend ROI by campaign type and attribution analysis",
        "Analyze marketing spend seasonality and budget planning effectiveness",
        "Compare marketing spend efficiency across product lines and market segments",
      ],
    },
  },
]

function useCustomChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string>("") // Add chat ID tracking

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    // Use localStorage for chat persistence instead
    try {
      const chatData = {
        id: currentChatId || Date.now().toString(),
        messages: newMessages,
        timestamp: new Date().toISOString(),
        name: `Chat ${new Date().toLocaleString()}`,
      }
      localStorage.setItem("currentChat", JSON.stringify(chatData))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }

    // Simulate AI response delay
    setTimeout(async () => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on our procurement analysis for "${input}", I can provide insights from our Phoenix, AZ facility data. Key areas include: cost center variance analysis showing 4 centers exceeding 40% quarterly thresholds, professional services at $8.95M with 36% growth requiring governance, and IT software concentration risk at $2.17M. Would you like me to dive deeper into any specific area?`,
        timestamp: new Date(),
      }
      const finalMessages = [...newMessages, aiResponse]
      setMessages(finalMessages)
      setIsLoading(false)

      try {
        const chatData = {
          id: currentChatId || Date.now().toString(),
          messages: finalMessages,
          timestamp: new Date().toISOString(),
          name: `Chat ${new Date().toLocaleString()}`,
        }
        localStorage.setItem("currentChat", JSON.stringify(chatData))
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
      }
    }, 1000)
  }

  const addAnalysisMessage = (content: string) => {
    const analysisMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
    }
    const newMessages = [...messages, analysisMessage]
    setMessages(newMessages)

    // ChatStorage.autoSaveChat(newMessages, currentChatId).catch(console.error)
  }

  const resetChat = async () => {
    if (messages.length > 0) {
      try {
        const chatData = {
          id: currentChatId || Date.now().toString(),
          messages,
          timestamp: new Date().toISOString(),
          name: `Chat ${new Date().toLocaleString()}`,
        }
        const existingChats = JSON.parse(localStorage.getItem("tempChats") || "[]")
        existingChats.push(chatData)
        localStorage.setItem("tempChats", JSON.stringify(existingChats))
        console.log("[v0] Chat saved to local storage")
      } catch (error) {
        console.error("Failed to save chat to localStorage:", error)
      }
    }

    setMessages([])
    setInput("")
    setIsLoading(false)
    setCurrentChatId("") // Reset chat ID
  }

  const loadChat = async (chatId: string) => {
    try {
      const storedChats = JSON.parse(localStorage.getItem("tempChats") || "[]")
      const chatData = storedChats.find((chat: any) => chat.id === chatId)
      if (chatData) {
        setMessages(chatData.messages)
        setCurrentChatId(chatId)
        console.log("[v0] Chat loaded from localStorage:", chatId)
      }
    } catch (error) {
      console.error("Failed to load chat:", error)
    }
  }

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    addAnalysisMessage,
    resetChat,
    setInput,
    currentChatId, // Expose chat ID
    loadChat, // Expose load function
  }
}

function MessageContent({ content }: { content: string }) {
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
}

export default function AIAssistantPage() {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null)
  const [savedChats, setSavedChats] = useState<any[]>([]) // Store full chat objects
  const [tempChats, setTempChats] = useState<any[]>([])
  const [showChatDropdown, setShowChatDropdown] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    addAnalysisMessage,
    resetChat,
    setInput,
    currentChatId,
    loadChat,
  } = useCustomChat()

  useEffect(() => {
    const loadAllChats = async () => {
      try {
        const storedTempChats = JSON.parse(localStorage.getItem("tempChats") || "[]")
        setTempChats(storedTempChats)
        setSavedChats(storedTempChats.filter((chat: any) => chat.saved))
      } catch (error) {
        console.error("Failed to load chats from localStorage:", error)
      }
    }

    loadAllChats()
  }, [])

  const handleAnalyzeInChat = (insightId: number) => {
    setSelectedInsight(insightId)
    const insight = insights.find((i) => i.id === insightId)
    if (insight && insight.analysisData) {
      console.log("[v0] Analyzing insight:", insight.title)

      const analysisContent = `
        <div class="space-y-6">
          <div class="bg-blue-600 text-white p-4 rounded-lg">
            <h3 class="font-semibold text-lg">Analyze the ${insight.title.toLowerCase()}: ${insight.description}</h3>
          </div>
          
          <div class="space-y-4">
            <p class="text-gray-700 leading-relaxed">${insight.analysisData.summary}</p>
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-lg mb-3 text-gray-900">Summary</h4>
              <p class="text-gray-700">Top-${insight.analysisData.dataTable.length} analysis shows critical patterns requiring immediate attention. ${insight.impact} total impact with ${insight.priority.toLowerCase()} priority classification. Budget utilization and variance thresholds exceeded in multiple categories requiring governance framework implementation.</p>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-lg mb-4 text-gray-900">Data Table</h4>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-100 border-b-2 border-gray-300">
                      ${Object.keys(insight.analysisData.dataTable[0])
                        .map(
                          (key) =>
                            `<th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">${key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</th>`,
                        )
                        .join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${insight.analysisData.dataTable
                      .map(
                        (row, index) =>
                          `<tr class="${index % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-gray-200 hover:bg-blue-50">
                        ${Object.values(row)
                          .map((value) => `<td class="border border-gray-300 px-4 py-3 text-gray-700">${value}</td>`)
                          .join("")}
                      </tr>`,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="font-semibold text-lg mb-4 text-gray-900">Suggested Follow-up Questions</h4>
              <div class="space-y-3">
                ${insight.analysisData.followUpQuestions
                  .map((fq) => {
                    const questionText = typeof fq === "string" ? fq : fq.question
                    return `<button class="block w-full text-left p-3 bg-white hover:bg-blue-100 rounded-lg border border-blue-300 text-blue-800 text-sm font-medium transition-colors duration-200 shadow-sm" onclick="handleFollowUpClick('${questionText}')">${questionText}</button>`
                  })
                  .join("")}
              </div>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p class="text-sm text-gray-600 mb-4">Welcome to the ${insight.category} procurement intelligence dashboard. Our AI assistant provides comprehensive analysis of your $32.4M annual procurement operations with ${insights.length} active insights.</p>
              
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 class="font-semibold text-gray-900 mb-3">Summary</h5>
                  <p class="text-sm text-gray-700">${insight.category} manages significant procurement operations with key risks identified: ${insight.priority.toLowerCase()} priority classification, ${insight.impact} financial impact, and ${insight.status.toLowerCase()} governance status requiring immediate attention.</p>
                </div>
                
                <div>
                  <h5 class="font-semibold text-gray-900 mb-3">Data Table</h5>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                      <thead>
                        <tr class="bg-gray-200 border-b border-gray-300">
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Category</th>
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Impact</th>
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Priority</th>
                          <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="bg-white border-b border-gray-200">
                          <td class="border border-gray-300 px-3 py-2">Total Annual Spend</td>
                          <td class="border border-gray-300 px-3 py-2 font-medium">$32.4M</td>
                          <td class="border border-gray-300 px-3 py-2 text-green-700">+21% YoY</td>
                          <td class="border border-gray-300 px-3 py-2">Budget optimization</td>
                        </tr>
                        <tr class="bg-gray-50 border-b border-gray-200">
                          <td class="border border-gray-300 px-3 py-2">${insight.category}</td>
                          <td class="border border-gray-300 px-3 py-2 font-medium">${insight.impact}</td>
                          <td class="border border-gray-300 px-3 py-2 text-orange-700">${insight.priority}</td>
                          <td class="border border-gray-300 px-3 py-2">Risk mitigation</td>
                        </tr>
                        <tr class="bg-white border-b border-gray-200">
                          <td class="border border-gray-300 px-3 py-2">Professional Services</td>
                          <td class="border border-gray-300 px-3 py-2 font-medium">$8.95M</td>
                          <td class="border border-gray-300 px-3 py-2 text-red-700">+36% growth</td>
                          <td class="border border-gray-300 px-3 py-2">Consolidate to 20</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-center space-x-3 pt-4">
              <button class="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors duration-200 font-medium" onclick="handleFeedback('helpful')">👍 Helpful</button>
              <button class="px-4 py-2 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium" onclick="handleFeedback('not-helpful')">👎 Not Helpful</button>
            </div>
          </div>`

      addAnalysisMessage(analysisContent)
    }
  }

  useEffect(() => {
    ;(window as any).handleFollowUpClick = (question: string) => {
      handleFollowUpQuestion(question)
    }
    ;(window as any).handleFeedback = (type: "helpful" | "not-helpful") => {
      handleFeedback(type)
    }

    return () => {
      delete (window as any).handleFollowUpClick
      delete (window as any).handleFeedback
    }
  }, [])

  const handleNewChat = () => {
    resetChat()
    console.log("[v0] New chat started - previous chat saved to blob storage")
  }

  const handleSaveChat = async () => {
    if (messages.length > 0) {
      try {
        const chatData = {
          id: currentChatId || Date.now().toString(),
          messages,
          timestamp: new Date().toISOString(),
          name: `Chat ${new Date().toLocaleString()}`,
          saved: true,
        }

        const existingChats = JSON.parse(localStorage.getItem("tempChats") || "[]")
        const existingIndex = existingChats.findIndex((chat: any) => chat.id === chatData.id)

        if (existingIndex >= 0) {
          existingChats[existingIndex] = chatData
        } else {
          existingChats.push(chatData)
        }

        localStorage.setItem("tempChats", JSON.stringify(existingChats))
        console.log("[v0] Chat saved to localStorage:", chatData.id)

        // Refresh saved chats list
        setSavedChats(existingChats.filter((chat: any) => chat.saved))
        setShowChatDropdown(false)
      } catch (error) {
        console.error("Failed to save chat:", error)
      }
    }
  }

  const handleLiveChat = () => {
    window.location.href = "/chat"
  }

  const handleFollowUpQuestion = (question: string) => {
    console.log("[v0] Follow-up question clicked:", question)

    // Find the insight and specific follow-up question data
    let responseContent = ""

    for (const insight of insights) {
      const followUp = insight.analysisData.followUpQuestions.find(
        (fq) => typeof fq === "object" && fq.question === question,
      )
      if (followUp && typeof followUp === "object") {
        responseContent = `
          <div class="space-y-6">
            <div class="bg-blue-600 text-white p-4 rounded-lg">
              <h3 class="font-semibold text-lg">${question}</h3>
            </div>
            ${followUp.response}
            <div class="flex justify-center space-x-3 pt-4">
              <button class="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors duration-200 font-medium" onclick="handleFeedback('helpful')">👍 Helpful</button>
              <button class="px-4 py-2 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium" onclick="handleFeedback('not-helpful')">👎 Not Helpful</button>
            </div>
          </div>`
        break
      }
    }

    // If no specific response found, use the original question as input
    if (!responseContent) {
      setInput(question)
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        handleSubmit(fakeEvent)
      }, 50)
    } else {
      // Add the comprehensive response directly to chat
      addAnalysisMessage(responseContent)
    }
  }

  const handleFeedback = (type: "helpful" | "not-helpful") => {
    console.log("[v0] Feedback:", type)
    // Could send to analytics
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChatDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest("[data-dropdown]")) {
          setShowChatDropdown(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showChatDropdown])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">SpendSmart</h1>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
                <Link href="/ai-assistant" className="text-primary font-medium border-b-2 border-primary pb-1">
                  Predictive Insights
                </Link>
                <Link href="/chat" className="text-muted-foreground hover:text-primary font-medium">
                  Live Chat
                </Link>
                <Link href="/insights-approval" className="text-muted-foreground hover:text-primary">
                  Insights Approval
                </Link>
                <Link href="/data-catalog" className="text-muted-foreground hover:text-primary">
                  Data Catalog
                </Link>
                <Link href="/settings" className="text-muted-foreground hover:text-primary">
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">mike@agenticlabs.io</span>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Insights Sidebar */}
        <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Insights</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Facility Location</span>
            </div>
            <div className="bg-muted rounded-md p-2 flex items-center justify-between cursor-pointer hover:bg-muted/80">
              <span className="text-sm">Phoenix, AZ</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-muted-foreground">6 approved insights</span>
            <span className="text-primary text-xs">Multi-team Access</span>
          </div>

          <div className="mb-4">
            <Button variant="outline" size="sm" className="w-full justify-between text-primary bg-transparent" asChild>
              <Link href="/insights-approval">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Manage Insights Approval
                </div>
                <span className="text-xs text-muted-foreground">Quick Access</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            {insights.map((insight) => (
              <Card key={insight.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${insight.color}`} />
                      <span className="text-xs font-medium text-primary">{insight.priority}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {insight.status}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground">{insight.category}</span>
                  </div>

                  <h3 className="font-medium text-sm mb-2">{insight.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{insight.description}</p>
                  <div className="text-xs text-muted-foreground mb-3">
                    Impact: <span className="font-medium text-foreground">{insight.impact}</span>
                  </div>

                  <Button size="sm" className="w-full text-xs" onClick={() => handleAnalyzeInChat(insight.id)}>
                    Analyze in Chat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* AI Analyst Header */}
          <div className="border-b border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Predictive Insights Analyst</h2>
                <p className="text-sm text-muted-foreground">Ask questions about your financial data and insights</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handleNewChat}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button variant="outline" size="sm" onClick={handleLiveChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveChat}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <div className="relative" data-dropdown>
                  <Button variant="outline" size="sm" onClick={() => setShowChatDropdown(!showChatDropdown)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chats
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  {showChatDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                      <div className="p-2">
                        {savedChats.length === 0 && tempChats.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-2">No saved chats</div>
                        ) : (
                          <>
                            {savedChats.length > 0 && (
                              <>
                                <div className="text-xs font-medium text-muted-foreground p-2 border-b">
                                  Saved Chats (Blob Storage)
                                </div>
                                {savedChats.slice(0, 5).map((chat, index) => (
                                  <div
                                    key={`blob-${index}`}
                                    className="text-sm p-2 hover:bg-muted rounded cursor-pointer"
                                    onClick={() => loadChat(chat.id)} // Add click handler to load chat
                                  >
                                    {chat.filename.replace(".json", "").split("-")[0]} -{" "}
                                    {new Date(chat.uploadedAt).toLocaleDateString()}
                                  </div>
                                ))}
                              </>
                            )}
                            {tempChats.length > 0 && (
                              <>
                                <div className="text-xs font-medium text-muted-foreground p-2 border-b">
                                  Recent Chats (Local)
                                </div>
                                {tempChats.slice(-5).map((chat, index) => (
                                  <div
                                    key={`temp-${index}`}
                                    className="text-sm p-2 hover:bg-muted rounded cursor-pointer"
                                  >
                                    {chat.name}
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4 max-w-4xl">
                {/* Show empty state when no messages */}
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Welcome to Predictive Insights Analyst</p>
                      <p className="text-sm">Ask questions about your procurement data and predictive insights</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 bg-transparent"
                        onClick={() => handleFollowUpQuestion("Analyze cost center variance patterns for Q4 2024")}
                      >
                        <div>
                          <div className="font-medium text-sm">Cost Center Analysis</div>
                          <div className="text-xs text-muted-foreground">Review Q4 spending patterns</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 bg-transparent"
                        onClick={() => handleFollowUpQuestion("Show professional services spending breakdown")}
                      >
                        <div>
                          <div className="font-medium text-sm">Professional Services</div>
                          <div className="text-xs text-muted-foreground">$8.95M spend analysis</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 bg-transparent"
                        onClick={() => handleFollowUpQuestion("Review IT software concentration risks")}
                      >
                        <div>
                          <div className="font-medium text-sm">IT Software Risks</div>
                          <div className="text-xs text-muted-foreground">$2.17M concentration analysis</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 bg-transparent"
                        onClick={() => handleFollowUpQuestion("Identify top supplier concentration risks")}
                      >
                        <div>
                          <div className="font-medium text-sm">Supplier Risks</div>
                          <div className="text-xs text-muted-foreground">Concentration analysis</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Render dynamic chat messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${message.role === "user" ? "ml-auto max-w-md" : "mr-auto max-w-4xl"}`}
                  >
                    <div
                      className={`rounded-lg p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}
                    >
                      <div className={message.role === "assistant" ? "bg-background rounded-md p-4" : ""}>
                        {message.role === "assistant" ? <MessageContent content={message.content} /> : message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="mr-auto max-w-4xl">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <div className="bg-background rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm text-muted-foreground">AI is analyzing your request...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about cost center variances, professional services, IT software risks, or any procurement insights..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? "Analyzing..." : "Send"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
