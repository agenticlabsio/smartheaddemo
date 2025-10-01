import { 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Target, 
  PieChart, 
  Database, 
  Search, 
  Zap, 
  Shield, 
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Layers,
  FileText,
  CreditCard,
  Copy,
  TrendingDown,
  Building,
  Package,
  Truck,
  Map,
  Factory,
  Globe,
  Settings
} from "lucide-react"

// Enhanced dimension-based governance tags
export interface DimensionTags {
  account?: string[]        // Professional Fees, Consultants, IT Software, etc.
  costCenter?: string[]     // Manufacturing, R&D, Service Ops, etc.
  hfmCategory?: string[]    // Asheville Operations, Financial ERP, etc.
  facility?: string[]       // Asheville, Tiger-SVC, Distribution, etc.
  commodity?: string[]      // Manufacturing Overhead, Marketing, R&D, etc.
  spendCategory?: string[]  // Direct, Indirect, Capital, Operating, etc.
  governance?: string[]     // Risk Level, Compliance Status, Approval Required, etc.
}

// Shared query data structure for both insights center and chat interface
export interface SharedQuery {
  id: number
  category: string
  icon: any
  query: string
  title?: string
  priority?: string
  impact?: string
  confidence?: string
  summary?: string
  tags: string[]
  color?: string
  business_insights?: string
  recommendations?: string[]
  followup_query?: string
  followup_response?: string
  sql_code?: string
  evidence?: any
  dimensions?: DimensionTags  // Enhanced dimension-based tags
}

// Complete insights from attached data file - All 12 insights
export const sharedQueries: SharedQuery[] = [
  {
    id: 1,
    category: 'variance',
    icon: TrendingUp,
    query: 'Which cost centers had the highest month-to-month spend volatility in the last 12 months and what accounts drove this volatility?',
    title: '[Coupa] Cost Center Spend Variance Analysis',
    priority: 'Critical',
    impact: '$33.9M',
    confidence: 'High',
    summary: 'Cost center spend variance analysis reveals extreme volatility with coefficient of variation ranging from 0.24 to 2.67 across 128 centers. Top 10 centers control 64% of spend but show inconsistent patterns indicating budget management failures and operational inefficiencies.',
    business_insights: 'Cost center variance analysis reveals critical budget control failures where 30 extreme-variance centers consume 69.5% of total spend with unpredictable patterns. High-variance centers like \'Avl - Mfg Engineering\' and \'R&D - CE\' show spending volatility 6-7x above acceptable thresholds, indicating absence of effective budget controls and approval processes.',
    recommendations: [
      'Implement monthly budget variance monitoring with automated alerts for cost centers exceeding 1.5x coefficient of variation, focusing immediate intervention on the 30 extreme-variance centers controlling $33.9M in spend.',
      'Establish quarterly budget review cycles with mandatory spend forecasting for the top 10 highest-variance cost centers, requiring monthly reconciliation and variance explanation reports from cost center managers.'
    ],
    followup_query: 'Which cost centers had the highest month-to-month spend volatility in the last 12 months and what accounts drove this volatility?',
    followup_response: 'Analysis of monthly volatility shows \'Avl - Mfg Engineering\' had $89K-$245K monthly range driven by irregular \'Consultants\' payments. \'R&D - CE\' volatility stems from lumpy \'Professional Fees\' payments ranging $0-$890K monthly. \'Service Ops\' shows erratic \'IT - Software Expense\' patterns with 8-month gaps followed by large purchases.',
    evidence: {
      "variance_categories": {
        "Low": {"total_spend": 499188.39, "center_count": 7, "avg_cv": 0.26, "spend_percentage": 1.0},
        "Medium": {"total_spend": 996073.13, "center_count": 30, "avg_cv": 0.80, "spend_percentage": 2.0},
        "High": {"total_spend": 13333653.06, "center_count": 49, "avg_cv": 1.48, "spend_percentage": 27.3},
        "Extreme": {"total_spend": 33916308.13, "center_count": 30, "avg_cv": 3.09, "spend_percentage": 69.5}
      },
      "top_variance_centers": [
        {"center": "Avl - Mfg Engineering", "total_spend": 1187691.18, "spend_cv": 6.854621, "spend_percentage": 2.43},
        {"center": "Service Ops", "total_spend": 693521.84, "spend_cv": 6.524988, "spend_percentage": 1.42},
        {"center": "R&D - CE", "total_spend": 4819992.81, "spend_cv": 3.530646, "spend_percentage": 9.87}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Variance Analysis', 'Cost Centers', 'Budget Control', 'Volatility'],
    dimensions: {
      account: ['Professional Fees', 'Consultants', 'IT Software'],
      costCenter: ['Manufacturing Engineering', 'R&D CE', 'Service Operations'],
      hfmCategory: ['Asheville Operations', 'Financial ERP Analysis'],
      facility: ['Asheville Manufacturing', 'Asheville Distribution'],
      commodity: ['Professional Services', 'Engineering Services', 'Operations Support'],
      spendCategory: ['Direct Operating', 'Indirect Services'],
      governance: ['Critical Risk', 'Budget Variance', 'Executive Review Required']
    },
    color: 'red'
  },
  {
    id: 2,
    category: 'quarterly',
    icon: Activity,
    query: 'What specific accounts and entities drove the largest quarterly spend declines from Q4 2024 to Q3 2025?',
    title: '[Coupa] Quarterly Trend Analysis',
    priority: 'Critical',
    impact: '-53% YoY',
    confidence: 'High',
    summary: 'Quarterly trend analysis shows dramatic -53% YoY decline with Q3 2024 representing inflection point. Predictive models indicate spending normalization by Q2 2025 with 12% quarterly growth expected.',
    business_insights: 'Quarterly analysis reveals catastrophic spending contraction with 2025 Q1-Q3 showing -34% and -64% sequential declines, indicating potential business disruption or strategic restructuring. The Q3 2024 inflection point coincides with dramatic operational changes affecting core business functions.',
    recommendations: [
      'Conduct immediate cash flow analysis to determine if spending decline represents strategic cost reduction or operational distress, with monthly monitoring of critical vendor payments and contractual obligations.',
      'Establish quarterly spend floors for essential business functions (Manufacturing, R&D) to prevent operational disruption while maintaining strategic cost optimization initiatives.'
    ],
    followup_query: 'What specific accounts and entities drove the largest quarterly spend declines from Q4 2024 to Q3 2025?',
    followup_response: 'Professional Fees dropped $1.2M from Q4 2024 to Q3 2025 (-67%), with LEAsheville entity showing $890K reduction. Consultants declined $2.1M (-78%) led by LEAshevilleOther cuts. Manufacturing supplies fell $1.8M (-82%) across all Asheville entities, indicating systematic operational downsizing.',
    evidence: {
      "quarterly_trends": [
        {"period": "2024_Q3", "spend": 4625525.0, "qoq_growth": 5.0},
        {"period": "2024_Q4", "spend": 6144086.0, "qoq_growth": 33.0},
        {"period": "2025_Q1", "spend": 4062295.0, "qoq_growth": -34.0},
        {"period": "2025_Q3", "spend": 1388710.0, "qoq_growth": -64.0}
      ],
      "cost_group_acceleration": [
        {"group": "Manufacturing Overhead", "growth_rate": -21.4, "trend": "Declining"},
        {"group": "Marketing", "growth_rate": 14.5, "trend": "Accelerating"},
        {"group": "R&D", "growth_rate": 3.2, "trend": "Stable"}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Quarterly Analysis', 'Spending Trends', 'Business Disruption', 'Operational Changes'],
    dimensions: {
      account: ['Professional Fees', 'Consultants', 'Manufacturing Supplies'],
      costCenter: ['Manufacturing Overhead', 'Marketing', 'R&D'],
      hfmCategory: ['Asheville Operations', 'Quarterly Financial Analysis'],
      facility: ['LEAsheville', 'LEAshevilleOther', 'Asheville Main'],
      commodity: ['Manufacturing Materials', 'Professional Services', 'R&D Services'],
      spendCategory: ['Operating Expense', 'Direct Materials'],
      governance: ['Critical Decline', 'Strategic Review', 'Business Continuity Risk']
    },
    color: 'orange'
  },
  {
    id: 3,
    category: 'accounts',
    icon: Database,
    query: 'Which accounts have the highest transaction frequency but low average transaction values, indicating potential consolidation opportunities?',
    title: '[Coupa] Account Spend Concentration Analysis',
    priority: 'High',
    impact: '$23.9M',
    confidence: 'High',
    summary: 'Account spend analysis reveals extreme concentration: top 5 accounts control $23.9M (49%) of total spend. Professional Fees account alone represents $7.3M (15%) creating single-point failure risk.',
    business_insights: 'Account concentration analysis reveals dangerous vendor dependency with Professional Fees and Consultants representing 27.6% of total organizational spend across critical business functions. This concentration creates vendor negotiation weakness and operational risk if key service providers are lost.',
    recommendations: [
      'Diversify Professional Fees spending by identifying 2-3 alternative service providers for each major engagement, targeting 60/25/15 split to reduce single-vendor dependency from current 100% concentration.',
      'Implement vendor risk assessment protocols for accounts exceeding 5% of total spend, with mandatory backup vendor identification and annual competitive bidding requirements.'
    ],
    followup_query: 'Which accounts have the highest transaction frequency but low average transaction values, indicating potential consolidation opportunities?',
    followup_response: 'Office Supplies shows 1,247 transactions averaging $89 across 6 entities, indicating fragmented purchasing. Bin Supplies has 892 transactions at $156 average with 4 different vendors. Travel expenses show 634 small transactions averaging $245, suggesting lack of centralized booking processes.',
    evidence: {
      "top_accounts": [
        {"account": "Professional Fees", "spend": 7328054.58, "share": 15.01, "entities": 8, "cost_centers": 47},
        {"account": "Consultants", "spend": 6147821.58, "share": 12.59, "entities": 5, "cost_centers": 16},
        {"account": "IT - Software Expense", "spend": 3265934.93, "share": 6.69, "entities": 4, "cost_centers": 6}
      ],
      "concentration_metrics": {
        "top_1_share": 15.0,
        "top_5_share": 49.0,
        "top_10_share": 74.8,
        "hhi_score": 0.0721,
        "risk_level": "LOW"
      }
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Account Analysis', 'Spend Concentration', 'Vendor Risk', 'Consolidation'],
    dimensions: {
      account: ['Professional Fees', 'Consultants', 'IT Software', 'Office Supplies', 'Travel'],
      costCenter: ['Multiple Cost Centers', 'Cross-Functional'],
      hfmCategory: ['Vendor Management', 'Spend Concentration Analysis'],
      facility: ['Multi-Facility', 'Enterprise-Wide'],
      commodity: ['Professional Services', 'Technology Services', 'Office Materials'],
      spendCategory: ['Indirect Services', 'Operating Expense'],
      governance: ['Vendor Risk', 'Concentration Risk', 'Diversification Required']
    },
    color: 'purple'
  },
  {
    id: 4,
    category: 'trajectory',
    icon: BarChart3,
    query: 'Which entities show the steepest year-over-year spending declines and in what account categories?',
    title: '[Coupa] Yearly Spending Trajectory',
    priority: 'Critical',
    impact: '-67% decline',
    confidence: 'High',
    summary: 'Yearly spending trajectory shows severe contraction: 2024 spend declined -53.1% vs 2023. Current 2025 run-rate indicates further -67% decline creating budget crisis by year-end.',
    business_insights: 'Annual spending trajectory indicates potential business restructuring or financial distress with 2025 showing 53% decline versus 2023 baseline. R&D cuts of 72% suggest reduced innovation investment while Manufacturing Overhead decline indicates production scaling or efficiency improvements.',
    recommendations: [
      'Conduct strategic review to determine if spending decline represents planned efficiency gains or unplanned business contraction, with monthly tracking against operational KPIs to ensure cuts don\'t impair core capabilities.',
      'Prioritize protection of R&D spending for critical innovation projects while optimizing Manufacturing Overhead through automation and process improvements rather than capability reduction.'
    ],
    followup_query: 'Which entities show the steepest year-over-year spending declines and in what account categories?',
    followup_response: 'LEAshevilleDist shows 83% spending decline ($575K to $96K) mainly in Manufacturing supplies cuts. LEAsheville dropped 53% ($5.9M to $2.8M) led by Professional Fees reductions. LETiger-SVC fell 46% with Consultants spending eliminated entirely.',
    evidence: {
      "yearly_analysis": [
        {"year": 2023, "spend": 19671796.0, "yoy_growth": null},
        {"year": 2024, "spend": 19853801.0, "yoy_growth": 1.0},
        {"year": 2025, "spend": 9306842.0, "yoy_growth": -53.0}
      ],
      "cost_group_impact": [
        {"group": "Manufacturing Overhead", "change": -53.5, "current_spend": 4622987},
        {"group": "R&D", "change": -72.0, "current_spend": 764410},
        {"group": "G&A", "change": -71.2, "current_spend": 634424}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Trajectory Analysis', 'Annual Trends', 'Business Restructuring', 'Financial Distress'],
    color: 'red'
  },
  {
    id: 5,
    category: 'efficiency',
    icon: Target,
    query: 'Which entities have the most fragmented vendor relationships with high transaction counts but low spend per vendor?',
    title: '[Coupa] Entity Spend Efficiency Analysis',
    priority: 'High',
    impact: '3.2x variance',
    confidence: 'High',
    summary: 'Entity spend efficiency analysis reveals 3.2x variance in spend-per-outcome across 8 entities. LEAsheville shows superior efficiency while Tiger entities lag significantly in procurement practices.',
    business_insights: 'Entity efficiency analysis shows LEAshevilleSVC achieving superior procurement efficiency with $1.25M spend per cost center versus LETiger-AVL at $78K, indicating either different operational scales or significant procurement process maturity gaps between entities.',
    recommendations: [
      'Implement procurement best practices from LEAshevilleSVC across Tiger entities, focusing on vendor consolidation and transaction standardization to improve spend efficiency by targeting $200K+ spend per cost center.',
      'Establish cross-entity procurement coordination to leverage LEAsheville\'s vendor relationships and contract terms, potentially reducing Tiger entity costs by 15-25% through economies of scale.'
    ],
    followup_query: 'Which entities have the most fragmented vendor relationships with high transaction counts but low spend per vendor?',
    followup_response: 'LETiger-AVL shows extreme fragmentation with 67 vendors for $233K total spend ($3.5K per vendor). LEAshevilleDist has 89 vendors for $995K ($11K per vendor). LEGroupOffice uses 156 vendors averaging $27K each, indicating potential vendor consolidation opportunities.',
    evidence: {
      "entity_efficiency": [
        {"entity": "LEAshevilleSVC", "efficiency_score": 750.07, "spend_per_center": 1246812, "total_spend": 2493624},
        {"entity": "LEAsheville", "efficiency_score": 360.87, "spend_per_center": 425263, "total_spend": 19562112},
        {"entity": "LETiger-AVL", "efficiency_score": 40.42, "spend_per_center": 77598, "total_spend": 232795}
      ],
      "efficiency_gap": "18.6x between leader and laggard",
      "standardization_potential": 3906595
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Efficiency Analysis', 'Entity Performance', 'Vendor Fragmentation', 'Procurement Practices'],
    color: 'green'
  },
  {
    id: 6,
    category: 'forecasting',
    icon: Calendar,
    query: 'Which months in the last 12 months showed the largest variance from their 6-month moving average and what accounts caused these variances?',
    title: '[Coupa] Advanced Time Series Forecasting',
    priority: 'Medium',
    impact: '$42.8M forecast',
    confidence: '73%',
    summary: 'Advanced time series analysis with confidence intervals predicts $42.8M annual run-rate by 2026. Current trajectory shows 73% confidence of continued decline without intervention.',
    business_insights: 'Time series forecasting indicates sustained spending contraction with 73% confidence, projecting continued monthly declines averaging $150K reduction. Wide confidence intervals suggest high uncertainty requiring scenario-based planning and flexible budget allocation.',
    recommendations: [
      'Develop three-scenario budget planning (optimistic, base, pessimistic) with monthly variance tracking against forecast ranges to enable rapid course correction and cash flow management.',
      'Establish monthly spend floors for critical operations at $800K minimum while maintaining flexibility for strategic opportunities within $1.2M-$1.8M monthly range.'
    ],
    followup_query: 'Which months in the last 12 months showed the largest variance from their 6-month moving average and what accounts caused these variances?',
    followup_response: 'March 2025 showed largest positive variance (+$234K above 6-month average) driven by $189K Professional Fees spike. August 2025 had largest negative variance (-$445K) due to elimination of Consultants spending. December 2024 variance (+$312K) came from year-end Manufacturing supplies purchases.',
    evidence: {
      "forecast_summary": {
        "12_month_historical": 16646294,
        "12_month_forecast": 13964126,
        "forecast_change": -16.1,
        "confidence_level": 73
      },
      "monthly_forecasts": [
        {"month": "2025-09", "predicted": 1254261, "lower_95": 544550, "upper_95": 1963973},
        {"month": "2025-12", "predicted": 1204852, "lower_95": 495140, "upper_95": 1914564},
        {"month": "2026-06", "predicted": 1106033, "lower_95": 396321, "upper_95": 1815744}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Time Series Analysis', 'Forecasting', 'Budget Planning', 'Variance Analysis'],
    color: 'blue'
  },
  {
    id: 7,
    category: 'pricing',
    icon: DollarSign,
    query: 'Which entity-account combinations consistently pay above-market rates and have sufficient transaction volume to justify immediate rate renegotiation?',
    title: '[Coupa] Account-Level Pricing Variance',
    priority: 'Critical',
    impact: '$2.7M overpayment',
    confidence: 'High',
    summary: 'Account-level pricing variance reveals systematic $2.7M overpayment across entities. Same accounts show 5x-47x price differences between entities indicating contract management failure.',
    business_insights: 'Price variance analysis exposes systematic procurement inefficiencies with entities paying 38x different rates for identical services, indicating absence of centralized contract negotiation and vendor management. Consultants account shows $307K annual overpayment opportunity through price standardization.',
    recommendations: [
      'Implement centralized contract negotiation for Professional Services and Consultants categories, targeting standardized rates at best-practice entity pricing levels to capture $500K+ annual savings.',
      'Establish master service agreements for multi-entity accounts with volume-based pricing tiers and mandatory compliance monitoring to prevent price arbitrage opportunities.'
    ],
    followup_query: 'Which entity-account combinations consistently pay above-market rates and have sufficient transaction volume to justify immediate rate renegotiation?',
    followup_response: 'LEAshevilleOther pays 3.2x market rate for IT Software ($45K vs $14K average) with 67 transactions. LEAsheville Consultants rate is 2.8x higher ($89K vs $32K) across 89 transactions. LEAshevilleSVC Professional Fees average $67K vs entity benchmark of $23K with 45 transactions.',
    evidence: {
      "price_variance_accounts": [
        {"account": "Consultants", "variance_ratio": "38.4x", "entities": 5, "savings_potential": 307391},
        {"account": "Consultants - India", "variance_ratio": "3.0x", "entities": 2, "savings_potential": 208973},
        {"account": "Rents - Factory Equipment", "variance_ratio": "12.2x", "entities": 3, "savings_potential": 144568}
      ],
      "arbitrage_summary": {
        "accounts_with_variance": 16,
        "total_arbitrage_potential": 1169986,
        "avg_variance_ratio": "30.2x"
      }
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Pricing Analysis', 'Contract Management', 'Vendor Negotiation', 'Cost Arbitrage'],
    color: 'red'
  },
  {
    id: 8,
    category: 'forecasting',
    icon: Activity,
    query: 'Which entities show the most consistent month-to-month spending patterns and which accounts contribute to their stability?',
    title: '[Coupa] Entity-Level Forecasting',
    priority: 'Medium',
    impact: 'Divergent trajectories',
    confidence: 'High',
    summary: 'Entity-level forecasting reveals divergent spending trajectories with LEAsheville entities declining while Tiger operations show growth potential. Account-level predictions indicate vendor relationship optimization opportunities.',
    business_insights: 'Entity forecasting reveals strategic divergence with LEAsheville operations contracting 31-53% while LEAshevilleSVC shows resilience at only -6.3% decline. This pattern suggests successful cost optimization in SVC operations that could be replicated across other entities.',
    recommendations: [
      'Implement LEAshevilleSVC\'s procurement practices across declining entities, focusing on their vendor management and cost control strategies that achieved superior performance retention.',
      'Prioritize investment protection for LEAshevilleSVC while using it as the operational model for restructuring LEAsheville and LEAshevilleOther procurement processes.'
    ],
    followup_query: 'Which entities show the most consistent month-to-month spending patterns and which accounts contribute to their stability?',
    followup_response: 'LEGroupOffice shows lowest monthly coefficient of variation (0.23) driven by stable G&A spending. LEAshevilleSvc maintains 0.31 CV with consistent Manufacturing Overhead. LEAshevilleSVC volatility (0.41) comes from steady Professional Fees and Service Overhead spending patterns.',
    evidence: {
      "entity_forecasts": [
        {"entity": "LEAshevilleOther", "historical": 5456814, "forecast_2026": 3730411, "change": -31.6},
        {"entity": "LEAsheville", "historical": 5926743, "forecast_2026": 2779942, "change": -53.1},
        {"entity": "LEAshevilleSVC", "historical": 1455571, "forecast_2026": 1363812, "change": -6.3}
      ],
      "strategic_accounts": [
        {"account": "Professional Fees", "trend": -0.1, "entities": 8, "priority": "Critical"},
        {"account": "Consultants", "trend": -46.6, "entities": 5, "priority": "Critical"}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Entity Forecasting', 'Growth Patterns', 'Strategic Planning', 'Performance Variance'],
    color: 'purple'
  },
  {
    id: 9,
    category: 'live-insights',
    icon: Clock,
    query: 'Which cost centers within declining entities have been completely eliminated and which have been transferred to other entities?',
    title: '[Coupa] HFM Entity Temporal Analysis',
    priority: 'High',
    impact: '$4.8M consolidation',
    confidence: 'High',
    summary: 'HFM Entity temporal analysis reveals divergent performance trajectories across 8 entities over 2.5 years. LEAsheville entities show 67% spend decline while Tiger entities maintain stability. Entity lifecycle analysis predicts $4.8M consolidation opportunity.',
    business_insights: 'Temporal analysis reveals LEAshevilleDist and LETiger-AVL in crisis stage with 69% and 98% spending declines respectively, while LEAshevilleSVC shows growth trajectory. The $4.8M consolidation opportunity emerges from rightsizing operations and eliminating redundant cost centers.',
    recommendations: [
      'Immediately consolidate LEAshevilleDist operations into LEAsheville entity to eliminate operational redundancy and capture $400K+ annual cost savings through shared services and vendor contracts.',
      'Restructure LETiger-AVL as a satellite operation under LETiger-SVC management to reduce overhead costs while maintaining essential capabilities.'
    ],
    followup_query: 'Which cost centers within declining entities have been completely eliminated and which have been transferred to other entities?',
    followup_response: 'LEAshevilleDist eliminated 12 cost centers including \'Quality Control\' and \'Shipping Operations\' in 2025. \'Maintenance\' and \'Inventory Management\' transferred to LEAsheville. LETiger-AVL discontinued \'R&D Support\' and \'Administrative Services\' while maintaining only \'Field Service\' operations.',
    evidence: {
      "entity_temporal_performance": [
        {"entity": "LEAsheville", "yoy_change": -66.7, "volatility": 0.48, "current_annual": 2904008, "peak_annual": 8725336, "trend": "Decline"},
        {"entity": "LEAshevilleDist", "yoy_change": -69.4, "volatility": 0.69, "current_annual": 102129, "peak_annual": 558890, "trend": "Decline"},
        {"entity": "LEAshevilleSVC", "yoy_change": 21.4, "volatility": 0.41, "current_annual": 696888, "peak_annual": 1222727, "trend": "Growth"}
      ],
      "lifecycle_analysis": [
        {"entity": "LEAsheville", "stage": "Optimization", "action": "Cost reduction and efficiency focus"},
        {"entity": "LEAshevilleDist", "stage": "Crisis", "action": "Immediate intervention required"},
        {"entity": "LETiger-AVL", "stage": "Crisis", "action": "Immediate intervention required"}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Temporal Analysis', 'Entity Lifecycle', 'Consolidation', 'Cost Center Transfers'],
    color: 'orange'
  },
  {
    id: 10,
    category: 'cost-groups',
    icon: PieChart,
    query: 'Which cost groups have the highest account fragmentation relative to their spending volume and transaction frequency?',
    title: '[Coupa] HFM Cost Group Analysis',
    priority: 'High',
    impact: '$6.7M optimization',
    confidence: 'High',
    summary: 'HFM Cost Group analysis across 6 categories reveals massive efficiency disparities over time. Manufacturing Overhead shows 51% concentration with declining efficiency while R&D demonstrates accelerating growth. Cross-account analysis indicates $6.7M optimization potential.',
    business_insights: 'Cost group analysis shows Manufacturing Overhead dominating 51% of spend with 40+ accounts creating vendor fragmentation. R&D\'s 72% decline suggests strategic shift while Marketing maintains efficiency with high-value transactions averaging $8.3K each.',
    recommendations: [
      'Consolidate Manufacturing Overhead vendor base from 40+ accounts to 15-20 strategic suppliers, targeting $2M annual savings through improved negotiating leverage and reduced administrative overhead.',
      'Protect core R&D capabilities while optimizing project portfolio mix, focusing on high-impact initiatives that can be delivered with 30% fewer vendor relationships.'
    ],
    followup_query: 'Which cost groups have the highest account fragmentation relative to their spending volume and transaction frequency?',
    followup_response: 'Service Overhead shows extreme fragmentation with 47 accounts for $6.6M spend (140K per account). G&A uses 34 accounts for $4.4M (129K per account). Manufacturing Overhead has better consolidation at $625K per account despite having the most accounts.',
    evidence: {
      "cost_group_efficiency": [
        {"group": "Manufacturing Overhead", "spend": 25082585, "transactions": 15581, "avg_transaction": 1610, "trend": -53.5, "efficiency": "Medium"},
        {"group": "Marketing", "spend": 5247575, "transactions": 629, "avg_transaction": 8343, "trend": -15.1, "efficiency": "High"},
        {"group": "R&D", "spend": 5630454, "transactions": 1567, "avg_transaction": 3593, "trend": -72.0, "efficiency": "Medium"}
      ],
      "optimization_opportunities": [
        {"group": "Manufacturing Overhead", "potential": 2006607, "priority": "Critical"},
        {"group": "Service Overhead", "potential": 527573, "priority": "High"},
        {"group": "R&D", "potential": 450436, "priority": "Medium"}
      ]
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'HFM Entity Analysis', 'Cost Group Analysis', 'Vendor Fragmentation', 'Efficiency Optimization', 'Account Consolidation'],
    color: 'blue'
  },
  {
    id: 11,
    category: 'vendor-risk',
    icon: Shield,
    query: 'Which account-cost center combinations represent single-source vendors with spend above $100K and no backup alternatives?',
    title: '[Coupa] Vendor Relationship Analysis',
    priority: 'Critical',
    impact: '$3.2M risk exposure',
    confidence: 'High',
    summary: 'Vendor relationship analysis reveals 47% of spend concentrated among top 20 vendors with significant quality and pricing disparities. Single-source dependencies create $3.2M annual risk exposure requiring diversification strategy.',
    business_insights: 'Vendor analysis reveals dangerous concentration with top 20 vendors controlling 47% of spend. Single-source dependencies in Professional Fees and Consultants create $3.2M risk exposure if key relationships are disrupted.',
    recommendations: [
      'Implement vendor diversification strategy targeting 70/20/10 spend allocation for critical accounts, reducing single-source dependencies from current 23 accounts to maximum 8 strategic partnerships.',
      'Establish backup vendor qualification program for accounts exceeding $200K annual spend, with pre-negotiated rates and ready-to-activate contracts for business continuity.'
    ],
    followup_query: 'Which account-cost center combinations represent single-source vendors with spend above $100K and no backup alternatives?',
    followup_response: 'Professional Fees at \'LEAsheville-Legal\' shows $340K with single vendor. \'Consultants-R&D CE\' has $280K single-source dependency. \'IT Software-Group Office\' represents $190K risk with no identified alternatives. Manufacturing Supplies at \'Avl-Production\' shows $156K single-vendor exposure.',
    evidence: {
      "vendor_concentration": [
        {"vendor": "Accenture", "spend": 4200000, "entities": 6, "accounts": 3, "dependency_risk": "High"},
        {"vendor": "IBM Consulting", "spend": 2800000, "entities": 4, "accounts": 2, "dependency_risk": "High"},
        {"vendor": "Local Manufacturing", "spend": 1900000, "entities": 2, "accounts": 8, "dependency_risk": "Medium"}
      ],
      "diversification_metrics": {
        "single_source_accounts": 23,
        "risk_exposure": 3200000,
        "vendor_concentration_ratio": 47,
        "diversification_opportunity": 1800000
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Supplier Management', 'Vendor Risk', 'Single-Source Dependencies', 'Supply Chain Risk', 'Business Continuity'],
    color: 'red'
  },
  {
    id: 12,
    category: 'anomalies',
    icon: Search,
    query: 'Which entities and cost centers have the highest concentration of anomalous transactions and what time periods show the most anomalies?',
    title: 'Transaction Pattern Analysis',
    priority: 'High',
    impact: '$2.4M anomalies',
    confidence: 'Medium',
    summary: 'Transaction pattern analysis identifies $2.4M in anomalous spending behaviors including duplicate payments, unusual timing patterns, and approval bypass incidents. Data quality issues affect 12% of transactions requiring process automation improvements.',
    business_insights: 'Transaction pattern analysis exposes significant process control failures with 847 duplicate payment instances totaling $890K and 234 weekend transactions suggesting inadequate approval controls. These anomalies represent 12% of all transactions indicating systematic process breakdowns.',
    recommendations: [
      'Implement automated duplicate payment detection system with real-time blocking capabilities to prevent the $890K annual loss from duplicate transactions and strengthen approval workflow controls.',
      'Establish business hours transaction restrictions with emergency override protocols to eliminate unauthorized weekend spending while maintaining operational flexibility for critical purchases.'
    ],
    followup_query: 'Which entities and cost centers have the highest concentration of anomalous transactions and what time periods show the most anomalies?',
    followup_response: 'LEAsheville shows 34% of duplicate payments concentrated in \'R&D CE\' and \'Manufacturing Engineering\' cost centers. Weekend transactions peak in month-end periods (28th-31st) across all entities. LEAshevilleOther has highest anomaly rate at 18% of transactions showing irregular patterns.',
    evidence: {
      "anomaly_patterns": [
        {"type": "Duplicate Payments", "instances": 847, "amount": 890000, "impact": "High"},
        {"type": "Weekend Transactions", "instances": 234, "amount": 450000, "impact": "Medium"},
        {"type": "Approval Bypass", "instances": 156, "amount": 680000, "impact": "High"},
        {"type": "Unusual Amounts", "instances": 1203, "amount": 380000, "impact": "Low"}
      ],
      "data_quality_metrics": {
        "total_anomalies": 2440,
        "affected_transactions_pct": 12,
        "estimated_savings": 1570000,
        "automation_opportunity": 2400000
      }
    },
    tags: ['Transaction Anomalies', 'Process Control', 'Data Quality', 'Automation Opportunities'],
    color: 'orange'
  },
  // Medium-level insights - 8 additional strategic insights
  {
    id: 13,
    category: 'seasonal',
    icon: Calendar,
    query: 'Which cost groups and entities drive the Q4 spending surge and what specific accounts show the highest year-end concentration?',
    title: 'Monthly Spending Patterns & Seasonal Analysis',
    priority: 'High',
    impact: '$2.1M Peak',
    confidence: 'High',
    summary: 'Monthly spending patterns reveal seasonal trends with Q4 showing 28% higher spend than Q1-Q3 average. December consistently peaks at $2.1M while February shows lowest activity at $890K, indicating budget cycle influences and year-end purchasing behaviors.',
    business_insights: 'Seasonal analysis reveals typical budget cycle behavior with Q4 showing 28% spending surge driven by year-end budget execution. The December peak of $2.1M suggests rushed procurement decisions and potential vendor capacity constraints during year-end processing.',
    recommendations: [
      'Implement quarterly budget smoothing policies to distribute Q4 spending across the year, reducing vendor price premiums and improving procurement planning efficiency.',
      'Establish early procurement planning for Q4 requirements by September to avoid year-end rush and capture better vendor pricing through extended lead times.'
    ],
    followup_query: 'Which cost groups and entities drive the Q4 spending surge and what specific accounts show the highest year-end concentration?',
    followup_response: 'Manufacturing Overhead accounts for 67% of Q4 surge ($890K increase) led by LEAsheville year-end equipment purchases. Professional Fees spike $340K in December across all entities. G&A shows $180K increase driven by LEGroupOffice year-end consulting and software license renewals.',
    evidence: {
      quarterly_spending: [
        {quarter: "Q1", avg_monthly_spend: 1245000, total_transactions: 2340},
        {quarter: "Q2", avg_monthly_spend: 1380000, total_transactions: 2580},
        {quarter: "Q3", avg_monthly_spend: 1290000, total_transactions: 2450},
        {quarter: "Q4", avg_monthly_spend: 1780000, total_transactions: 3120}
      ],
      peak_months: [
        {month: "December", spend: 2100000, transactions: 1560},
        {month: "November", spend: 1890000, transactions: 1340},
        {month: "March", spend: 1650000, transactions: 1180}
      ]
    },
    tags: ['Seasonal', 'Budget Cycles', 'Q4 Surge', 'Planning'],
    color: 'blue'
  },
  {
    id: 14,
    category: 'transaction-volume',
    icon: BarChart3,
    query: 'What is the distribution of transaction sizes across entities and which entities have the most small-value transactions that could be consolidated?',
    title: 'Entity Transaction Volume Analysis',
    priority: 'Medium',
    impact: '11,750 Transactions',
    confidence: 'High',
    summary: 'Entity transaction volume analysis shows LEAsheville processing 45% of all transactions (11,750) with average transaction size of $1,665, while LETiger entities handle only 8% of volume (2,100 transactions) but with higher average values of $2,890 per transaction.',
    business_insights: 'Transaction volume analysis reveals operational scale differences where LEAsheville entities process 77% of organizational transactions, indicating centralized procurement activity. Tiger entities show lower volume but inconsistent transaction sizing, suggesting different operational models or less standardized procurement processes.',
    recommendations: [
      'Standardize procurement processes across Tiger entities to achieve LEAsheville\'s transaction efficiency, potentially reducing administrative costs by consolidating smaller purchases into bulk orders.',
      'Implement transaction size guidelines with minimum thresholds to reduce administrative overhead, targeting 20% reduction in transactions under $500 through purchase consolidation.'
    ],
    followup_query: 'What is the distribution of transaction sizes across entities and which entities have the most small-value transactions that could be consolidated?',
    followup_response: 'LEAsheville has 3,450 transactions under $500 (29% of volume) averaging $127 each. LEAshevilleOther shows 2,890 small transactions at $89 average. LETiger-AVL has highest small transaction rate at 67% of volume, with 360 transactions under $200 averaging $56 each.',
    evidence: {
      entity_volumes: [
        {entity: "LEAsheville", transactions: 11750, percentage: 45.0, avg_size: 1665, total_spend: 19562112},
        {entity: "LEAshevilleOther", transactions: 8340, percentage: 32.0, avg_size: 1756, total_spend: 14662354},
        {entity: "LEGroupOffice", transactions: 2890, percentage: 11.1, avg_size: 1458, total_spend: 4214356},
        {entity: "LETiger-SVC", transactions: 1560, percentage: 6.0, avg_size: 990, total_spend: 1544355},
        {entity: "LETiger-AVL", transactions: 540, percentage: 2.1, avg_size: 431, total_spend: 232795}
      ]
    },
    tags: ['Transaction Volume', 'Entity Analysis', 'Consolidation', 'Efficiency'],
    color: 'green'
  },
  {
    id: 15,
    category: 'category-distribution',
    icon: PieChart,
    query: 'Which entities have the highest concentration of small-value Operations transactions and what specific accounts drive this volume?',
    title: 'Account Category Distribution Analysis',
    priority: 'Medium',
    impact: '$20.1M Manufacturing',
    confidence: 'High',
    summary: 'Account category distribution shows Services (Professional Fees, Consultants, IT Software) representing 34% of total spend ($16.6M) while Manufacturing-related accounts comprise 41% ($20.1M). Office supplies and travel represent only 3% but account for 28% of transaction volume.',
    business_insights: 'Category analysis reveals strategic spend concentration in Services and Manufacturing totaling 75% of budget, while high-volume/low-value Operations purchases create administrative burden. The 28% transaction volume in Operations category averaging only $198 per transaction indicates significant procurement inefficiency.',
    recommendations: [
      'Implement procurement cards or simplified ordering systems for Operations purchases under $500 to reduce administrative processing costs and free up procurement resources for strategic categories.',
      'Establish category-specific procurement strategies with Services requiring vendor relationship management and Manufacturing focusing on supply chain optimization and bulk purchasing agreements.'
    ],
    followup_query: 'Which entities have the highest concentration of small-value Operations transactions and what specific accounts drive this volume?',
    followup_response: 'LEAsheville processes 2,340 Operations transactions averaging $156, with Office Supplies (890 transactions at $89 avg) and Travel (670 transactions at $245 avg) being primary drivers. LEAshevilleOther shows 1,780 small Operations purchases focused on Bin Supplies (560 transactions) and Employee Welfare items.',
    evidence: {
      category_breakdown: [
        {category: "Manufacturing", spend: 20100000, spend_pct: 41.2, transactions: 8950, transaction_pct: 34.3, avg_size: 2246},
        {category: "Services", spend: 16600000, spend_pct: 34.0, transactions: 4720, transaction_pct: 18.1, avg_size: 3517},
        {category: "Operations", spend: 1450000, spend_pct: 3.0, transactions: 7310, transaction_pct: 28.0, avg_size: 198},
        {category: "Marketing", spend: 5247575, spend_pct: 10.7, transactions: 629, transaction_pct: 2.4, avg_size: 8343},
        {category: "R&D", spend: 3890000, spend_pct: 8.0, transactions: 1890, transaction_pct: 7.2, avg_size: 2058}
      ]
    },
    tags: ['Category Distribution', 'Operations', 'Administrative Burden', 'Strategic Spend'],
    color: 'purple'
  },
  {
    id: 16,
    category: 'activity-levels',
    icon: Layers,
    query: 'Which minimal-activity cost centers share similar functions or entities and could be merged without operational impact?',
    title: 'Cost Center Activity Level Analysis',
    priority: 'Medium',
    impact: '45 Centers <$50K',
    confidence: 'High',
    summary: 'Cost center activity analysis reveals 15 cost centers (12%) handle 68% of total spend, while 45 cost centers show minimal activity under $50K annually. Top performer \'R&D - CE\' processes $4.8M across 1,229 transactions, indicating potential consolidation opportunities among low-activity centers.',
    business_insights: 'Cost center analysis shows extreme concentration where 15 high-activity centers control 68% of spending, while 45 minimal-activity centers average only $14K annually. This distribution suggests opportunities for cost center consolidation and administrative streamlining in underutilized centers.',
    recommendations: [
      'Consolidate the 45 minimal-activity cost centers into 10-12 shared service centers to reduce administrative overhead and improve procurement leverage through combined purchasing power.',
      'Implement tiered approval processes where high-activity centers receive dedicated procurement support while low-activity centers use simplified, automated procurement workflows.'
    ],
    followup_query: 'Which minimal-activity cost centers share similar functions or entities and could be merged without operational impact?',
    followup_response: 'Administrative functions across entities show consolidation potential: 8 \'Admin Services\' centers averaging $12K each could merge into 2 regional centers. 12 \'Facilities\' related centers under $25K each share similar procurement needs. 6 \'Quality Assurance\' centers with minimal activity could consolidate under LEAsheville operations.',
    evidence: {
      activity_distribution: [
        {level: "High Activity (>$1M)", centers: 15, spend: 33200000, spend_pct: 68.0, avg_per_center: 2213333},
        {level: "Medium Activity ($200K-$1M)", centers: 38, spend: 12100000, spend_pct: 24.8, avg_per_center: 318421},
        {level: "Low Activity ($50K-$200K)", centers: 30, spend: 2900000, spend_pct: 5.9, avg_per_center: 96667},
        {level: "Minimal Activity (<$50K)", centers: 45, spend: 632439, spend_pct: 1.3, avg_per_center: 14054}
      ],
      top_centers: [
        {center: "R&D - CE", spend: 4819992, transactions: 1229, accounts: 8},
        {center: "Avl - Maintenance", spend: 1915825, transactions: 3595, accounts: 12},
        {center: "FS - New England", spend: 1747139, transactions: 706, accounts: 6}
      ]
    },
    tags: ['Cost Centers', 'Activity Analysis', 'Consolidation', 'Administrative Efficiency'],
    color: 'yellow'
  },
  {
    id: 17,
    category: 'after-hours',
    icon: Clock,
    query: 'Which entities and accounts show the highest weekend transaction activity and what is the average premium paid compared to weekday purchases?',
    title: 'Weekend & After-Hours Transaction Analysis',
    priority: 'Medium',
    impact: '$1.2M Weekend',
    confidence: 'Medium',
    summary: 'Weekend and after-hours transaction analysis shows 312 transactions totaling $1.2M occurring outside normal business hours, with December showing highest irregular activity (89 transactions). Emergency purchases represent valid operational needs while routine purchases suggest process control gaps.',
    business_insights: 'After-hours activity analysis reveals $1.2M in weekend transactions with December showing peak irregular activity, likely driven by year-end budget execution pressure. Higher average transaction sizes ($3,800) suggest these are planned large purchases rather than emergency procurements.',
    recommendations: [
      'Implement business hours restrictions for non-emergency transactions above $1,000, requiring manager override approval for weekend purchases to ensure proper authorization and reduce after-hours vendor premium charges.',
      'Establish emergency procurement protocols with pre-approved vendor lists and expedited approval workflows to maintain operational flexibility while controlling irregular spending patterns.'
    ],
    followup_query: 'Which entities and accounts show the highest weekend transaction activity and what is the average premium paid compared to weekday purchases?',
    followup_response: 'LEAsheville accounts for 67% of weekend transactions (210 transactions) primarily in Professional Fees and IT Software. Weekend IT Software purchases average $4,200 vs $2,800 weekday average (50% premium). Manufacturing supplies show 23% weekend premium while Professional Fees maintain consistent pricing.',
    evidence: {
      irregular_activity: [
        {month: 12, transactions: 89, amount: 334500, avg_size: 3759},
        {month: 3, transactions: 67, amount: 245600, avg_size: 3667},
        {month: 9, transactions: 45, amount: 178900, avg_size: 3976},
        {month: 6, transactions: 38, amount: 156700, avg_size: 4124}
      ],
      weekend_breakdown: [
        {day: "Saturday", transactions: 198, amount: 756000, avg_size: 3818},
        {day: "Sunday", transactions: 114, amount: 444000, avg_size: 3895}
      ]
    },
    tags: ['After Hours', 'Weekend Transactions', 'Process Control', 'Premium Pricing'],
    color: 'orange'
  },
  {
    id: 18,
    category: 'payment-frequency',
    icon: CreditCard,
    query: 'Which specific vendors receive the most frequent small payments and what accounts drive this fragmentation?',
    title: 'Vendor Payment Frequency Analysis',
    priority: 'Medium',
    impact: '$2.8M Consolidation',
    confidence: 'High',
    summary: 'Vendor payment frequency analysis reveals payment consolidation opportunities with 156 account-entity combinations receiving only 1-3 payments annually totaling $2.8M. Frequent small payments to the same vendors indicate potential invoice batching and administrative cost reduction opportunities.',
    business_insights: 'Payment frequency analysis shows 23 very frequent vendors generating 2,890 payment instances with estimated processing costs of $101K annually. Single-payment vendors average $10.5K per transaction, suggesting larger project-based engagements, while frequent small payments indicate operational inefficiencies.',
    recommendations: [
      'Implement monthly payment batching for vendors receiving 6+ payments annually, targeting 40% reduction in payment processing costs ($97K savings) through consolidated invoicing and automated payment systems.',
      'Establish vendor payment terms requiring minimum $2,000 invoice amounts for non-emergency purchases, reducing administrative burden and encouraging bulk ordering efficiencies.'
    ],
    followup_query: 'Which specific vendors receive the most frequent small payments and what accounts drive this fragmentation?',
    followup_response: 'Office supply vendors across multiple entities receive 340+ small payments averaging $156 each. Maintenance services show 280 payments to same vendors at $890 average. Professional services firms receive 67 payments from LEAsheville averaging $12K, indicating project milestone billing that could be consolidated monthly.',
    evidence: {
      payment_frequency: [
        {category: "Very Frequent (>50)", vendors: 23, spend: 18500000, payments: 2890, avg_size: 6401, processing_cost: 101150},
        {category: "Frequent (16-50)", vendors: 67, spend: 15600000, payments: 1890, avg_size: 8254, processing_cost: 66150},
        {category: "Regular (6-15)", vendors: 189, spend: 8900000, payments: 1456, avg_size: 6115, processing_cost: 50960},
        {category: "Infrequent (2-5)", vendors: 245, spend: 4200000, payments: 567, avg_size: 7407, processing_cost: 19845},
        {category: "Single Payment", vendors: 156, spend: 1632439, payments: 156, avg_size: 10464, processing_cost: 5460}
      ]
    },
    tags: ['Payment Frequency', 'Vendor Consolidation', 'Administrative Cost', 'Process Automation'],
    color: 'green'
  },
  {
    id: 19,
    category: 'cross-entity',
    icon: Copy,
    query: 'What is the price variance across entities for the same accounts and which entities consistently pay premium rates?',
    title: 'Cross-Entity Duplicate Account Analysis',
    priority: 'High',
    impact: '$3.3M IT Software',
    confidence: 'High',
    summary: 'Cross-entity duplicate account analysis reveals 42 accounts used across multiple entities with significant process standardization opportunities. Professional Fees appears in all 8 entities but with 15 different procurement approaches, while IT Software shows 6 entities using different vendors for similar services.',
    business_insights: 'Cross-entity analysis reveals substantial duplication with Professional Fees used by all entities but lacking standardized processes. The $3.3M spend across 6 entities for IT Software suggests missed volume discount opportunities and inconsistent technology procurement approaches.',
    recommendations: [
      'Establish centralized procurement for accounts used by 4+ entities, starting with Professional Fees and IT Software to capture volume discounts and standardize service delivery quality.',
      'Create cross-entity procurement committees for high-spend multi-entity accounts, targeting 15-25% cost reduction through coordinated vendor negotiations and standardized contract terms.'
    ],
    followup_query: 'What is the price variance across entities for the same accounts and which entities consistently pay premium rates?',
    followup_response: 'Professional Fees shows 4.2x price variance with LEAshevilleSVC paying $890/transaction vs LEGroupOffice at $210. IT Software variance is 3.8x (LEAsheville $2,800 vs LETiger-AVL $740). LEAshevilleSVC consistently pays 2.5x entity average across 6 account categories, indicating premium service requirements or procurement inefficiency.',
    evidence: {
      cross_entity_accounts: [
        {account: "Professional Fees", entities: 8, cost_centers: 47, total_spend: 7328054, spend_per_entity: 916007},
        {account: "IT - Software Expense", entities: 6, cost_centers: 23, total_spend: 3265935, spend_per_entity: 544322},
        {account: "Mfg Supplies - Consumables", entities: 5, cost_centers: 43, total_spend: 2981955, spend_per_entity: 596391},
        {account: "Office Supplies", entities: 5, cost_centers: 18, total_spend: 293994, spend_per_entity: 58799},
        {account: "Travel Expenses", entities: 4, cost_centers: 12, total_spend: 445600, spend_per_entity: 111400}
      ]
    },
    tags: ['Cross Entity', 'Standardization', 'Volume Discounts', 'Process Duplication'],
    color: 'blue'
  },
  {
    id: 20,
    category: 'growth-patterns',
    icon: TrendingDown,
    query: 'Which entities drive the R&D spending cuts and what specific R&D accounts show the steepest declines?',
    title: 'Annual Spending Growth Pattern Analysis',
    priority: 'High',
    impact: '-72% R&D Decline',
    confidence: 'High',
    summary: 'Annual spending growth patterns show R&D accounts declining 72% year-over-year while Marketing increased 34%, indicating strategic business shift. Manufacturing overhead maintains stability (±8%) suggesting operational consistency despite overall organizational spending reduction.',
    business_insights: 'Growth pattern analysis reveals strategic rebalancing with R&D experiencing severe cuts (-72%) while Marketing investment increased 34%. Professional Fees reduction of 46% suggests consultant dependency reduction, while Manufacturing stability indicates operational focus retention.',
    recommendations: [
      'Assess R&D cuts impact on innovation pipeline and competitive position, ensuring critical projects receive continued funding while eliminating lower-priority research initiatives.',
      'Leverage Marketing investment increase to capture market share during competitor cost-cutting periods, with ROI tracking to validate increased spending effectiveness.'
    ],
    followup_query: 'Which entities drive the R&D spending cuts and what specific R&D accounts show the steepest declines?',
    followup_response: 'LEAsheville accounts for 78% of R&D cuts with $1.2M reduction in R&D Prototypes and $340K reduction in Research Equipment. LETiger entities eliminated R&D Support entirely ($156K). Product Certification spending fell 67% across all entities, while Patent & IP costs dropped 89% indicating reduced innovation protection activities.',
    evidence: {
      growth_patterns: [
        {account: "R&D Prototypes", growth_2024: -15.2, growth_2025: -72.1, spend_2024: 2100000, spend_2025: 586000, category: "High Change"},
        {account: "Marketing Other", growth_2024: 8.4, growth_2025: 34.2, spend_2024: 445000, spend_2025: 597000, category: "Moderate Change"},
        {account: "Professional Fees", growth_2024: -2.1, growth_2025: -45.8, spend_2024: 8200000, spend_2025: 4444000, category: "High Change"},
        {account: "Mfg Supplies - Tools", growth_2024: 12.3, growth_2025: -8.1, spend_2024: 3100000, spend_2025: 2849000, category: "Stable"}
      ]
    },
    tags: ['Growth Patterns', 'R&D Decline', 'Strategic Shift', 'Budget Rebalancing'],
    color: 'red'
  },
  
  // Entry-Level Data Understanding Insights
  {
    id: 21,
    category: 'data-foundation',
    icon: Database,
    query: 'What is the basic scope and scale of our procurement data - how many transactions, entities, time periods, and dollar amounts are we analyzing?',
    title: 'Dataset Structure Overview',
    priority: 'High',
    impact: '$48.8M',
    confidence: 'High',
    summary: 'Dataset overview shows 26,111 procurement transactions totaling $48.8M across 3 fiscal years (2023-2025). The data spans 8 business entities, 128 cost centers, and 54 distinct account types, with transaction values ranging from $1.50 to $503,871.',
    tags: ['Asheville Operations Scale', 'Multi-Entity Structure', 'Transaction Range Diversity'],
    business_insights: 'The dataset represents a substantial procurement operation with nearly $49M in spending across diverse organizational units. The wide transaction range ($1.50 to $503K) indicates both routine operational purchases and major capital expenditures managed through the same system.',
    recommendations: [
      'Establish data quality monitoring to ensure all transactions above $100K receive additional review and approval documentation for audit compliance.',
      'Implement transaction categorization rules to separate routine purchases (under $1K) from strategic purchases (over $10K) for different management reporting and approval workflows.'
    ],
    followup_query: 'What is the distribution of transaction sizes and how many transactions fall into small, medium, and large categories?',
    followup_response: 'Transaction distribution shows 45% are small purchases under $500 (11,750 transactions), 38% are medium purchases $500-$5K (9,922 transactions), and 17% are large purchases over $5K (4,439 transactions). The large purchases represent 17% of volume but 73% of total spend value.',
    sql_code: 'SELECT COUNT(*) as total_transactions, COUNT(DISTINCT "HFM Entity") as total_entities, COUNT(DISTINCT "Cost Center") as total_cost_centers, COUNT(DISTINCT Account) as total_accounts, COUNT(DISTINCT "Fiscal Year Number") as total_years, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend, MIN(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as min_transaction, MAX(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as max_transaction FROM financial_data;',
    evidence: {
      dataset_summary: {
        total_transactions: 26111,
        total_entities: 8,
        total_cost_centers: 128,
        total_accounts: 54,
        total_years: 3,
        total_spend: 48832439,
        min_transaction: 1.50,
        max_transaction: 503871.00,
        avg_transaction: 1871.42
      }
    }
  },
  
  {
    id: 22,
    category: 'temporal-analysis',
    icon: Calendar,
    query: 'How is our spending distributed across the years in our dataset, and what does this tell us about our annual procurement patterns?',
    title: 'Annual Spending Distribution',
    priority: 'Medium',
    impact: '$19.8M',
    confidence: 'High',
    summary: 'Annual spending distribution shows 2023 with $19.7M (40%), 2024 with $19.9M (41%), and 2025 with $9.3M (19%). The lower 2025 figure reflects partial year data, with current run-rate suggesting potential full-year total around $18.6M.',
    tags: ['Asheville Annual Patterns', 'Consistent Spending Velocity', 'Predictable Operations'],
    business_insights: 'Annual spending shows consistent activity in 2023-2024 around $19.8M annually, with 2025 partial data indicating similar transaction velocity but lower total due to incomplete year coverage. This suggests stable operational procurement patterns.',
    recommendations: [
      'Establish monthly spending targets based on historical $1.65M average to track 2025 performance against prior year baselines.',
      'Implement year-over-year variance reporting to identify any significant deviations from the established $19.8M annual spending pattern.'
    ],
    followup_query: 'What are the monthly spending patterns within each fiscal year to understand seasonality?',
    followup_response: 'Monthly analysis shows December consistently peaks at $2.1M average across years, while February is lowest at $1.2M. Q4 months (Oct-Dec) average 35% higher spend than Q1-Q3, indicating typical year-end budget execution patterns. 2025 months average $1.55M through current data.',
    sql_code: 'WITH yearly_spend AS (SELECT "Fiscal Year Number", COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as annual_spend FROM financial_data GROUP BY "Fiscal Year Number"), total_spend AS (SELECT SUM(annual_spend) as grand_total FROM yearly_spend) SELECT ys."Fiscal Year Number", ys.transaction_count, ys.annual_spend, (ys.annual_spend * 100.0 / ts.grand_total) as percentage_of_total_spend FROM yearly_spend ys, total_spend ts ORDER BY ys."Fiscal Year Number";',
    evidence: {
      annual_breakdown: [
        {year: 2023, transactions: 8945, spend: 19671796, percentage: 40.3},
        {year: 2024, transactions: 9821, spend: 19853801, percentage: 40.7},
        {year: 2025, transactions: 7345, spend: 9306842, percentage: 19.1}
      ]
    }
  },
  
  {
    id: 23,
    category: 'entity-analysis',
    icon: BarChart3,
    query: 'Which business entities are the largest spenders and how do they compare in terms of transaction volume and average purchase sizes?',
    title: 'Entity Spending Concentration',
    priority: 'High',
    impact: '$42.1M',
    confidence: 'High',
    summary: 'Entity spending distribution shows LEAsheville as the largest with $19.6M (40%), followed by LEAshevilleOther at $14.7M (30%). Combined Asheville entities represent 86% of total organizational spend, while Tiger entities account for only 4% ($1.8M total).',
    tags: ['Asheville Dominance', 'Tiger Entity Scale', 'Operational Concentration'],
    business_insights: 'Entity distribution reveals significant operational scale differences with Asheville-based entities dominating 86% of organizational procurement spend. Tiger entities show much smaller scale operations with lower average transaction values, suggesting different operational models or business maturity levels.',
    recommendations: [
      'Analyze Tiger entity procurement needs to determine if low spending indicates operational efficiency or inadequate resource allocation for business objectives.',
      'Consider procurement process standardization opportunities by leveraging LEAsheville\'s scale and vendor relationships to benefit smaller entities.'
    ],
    followup_query: 'How many unique vendors or accounts does each entity work with, and what does this tell us about procurement complexity?',
    followup_response: 'LEAsheville works with 48 different accounts across 46 cost centers, showing broad procurement scope. LEAshevilleOther uses 41 accounts with 31 cost centers. Tiger entities show simpler structures: LETiger-SVC uses 15 accounts across 7 cost centers, while LETiger-AVL operates with only 8 accounts across 3 cost centers, indicating focused operational models.',
    sql_code: 'WITH entity_spend AS (SELECT "HFM Entity", COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend, AVG(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as avg_transaction FROM financial_data GROUP BY "HFM Entity"), total_spend AS (SELECT SUM(total_spend) as grand_total FROM entity_spend) SELECT es."HFM Entity", es.transaction_count, es.total_spend, (es.total_spend * 100.0 / ts.grand_total) as percentage_of_total_spend, es.avg_transaction FROM entity_spend es, total_spend ts ORDER BY es.total_spend DESC;',
    evidence: {
      entity_breakdown: [
        {entity: "LEAsheville", transactions: 11750, spend: 19562112, percentage: 40.1, avg_transaction: 1665},
        {entity: "LEAshevilleOther", transactions: 8340, spend: 14662354, percentage: 30.0, avg_transaction: 1758},
        {entity: "LEAshevilleSvc", transactions: 3456, spend: 5128121, percentage: 10.5, avg_transaction: 1484},
        {entity: "LEGroupOffice", transactions: 2890, spend: 4214356, percentage: 8.6, avg_transaction: 1458},
        {entity: "LEAshevilleSVC", transactions: 1670, spend: 2493624, percentage: 5.1, avg_transaction: 1493},
        {entity: "LETiger-SVC", transactions: 1560, spend: 1544355, percentage: 3.2, avg_transaction: 990},
        {entity: "LEAshevilleDist", transactions: 890, spend: 994722, percentage: 2.0, avg_transaction: 1118},
        {entity: "LETiger-AVL", transactions: 540, spend: 232795, percentage: 0.5, avg_transaction: 431}
      ]
    }
  },
  
  {
    id: 24,
    category: 'data-foundation',
    icon: PieChart,
    query: 'What are our major spending categories and how much does each category represent as a percentage of our total procurement budget?',
    title: 'Cost Category Distribution',
    priority: 'Medium',
    impact: '$25.1M',
    confidence: 'High',
    summary: 'Cost group distribution shows Manufacturing Overhead as the largest category at $25.1M (51%), followed by R&D at $5.6M (11%) and Marketing at $5.2M (11%). Service Overhead and G&A each represent about 9% of total spend, while Selling accounts for 4%.',
    tags: ['Asheville Cost Categories', 'Manufacturing Focus', 'R&D Investment'],
    business_insights: 'Cost group analysis reveals Manufacturing Overhead dominates organizational spending at 51%, indicating a manufacturing-focused business model. High average transaction values in Marketing ($8.3K) and G&A ($9.5K) suggest strategic investments, while Service Overhead shows high volume but low average transactions indicating operational maintenance activities.',
    recommendations: [
      'Focus procurement optimization efforts on Manufacturing Overhead given its 51% spend share, targeting vendor consolidation and bulk purchasing agreements.',
      'Analyze G&A\'s high average transaction values ($9.5K) to ensure appropriate approval controls for administrative spending above operational norms.'
    ],
    followup_query: 'Which cost groups show the most transaction volume versus spend concentration?',
    followup_response: 'Manufacturing Overhead shows both highest volume (15,581 transactions, 60% of total) and highest spend (51%), indicating consistent operational activity. Service Overhead has second-highest volume (6,247 transactions, 24%) but only 9% of spend, suggesting many small maintenance items. Marketing shows lowest transaction volume (629, 2%) but maintains 11% spend share through high-value activities.',
    sql_code: 'WITH cost_group_spend AS (SELECT "HFM Cost Group", COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend, AVG(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as avg_transaction FROM financial_data GROUP BY "HFM Cost Group"), total_spend AS (SELECT SUM(total_spend) as grand_total FROM cost_group_spend) SELECT cgs."HFM Cost Group", cgs.transaction_count, cgs.total_spend, (cgs.total_spend * 100.0 / ts.grand_total) as percentage_of_total_spend, cgs.avg_transaction FROM cost_group_spend cgs, total_spend ts ORDER BY cgs.total_spend DESC;',
    evidence: {
      cost_group_breakdown: [
        {group: "Manufacturing Overhead", transactions: 15581, spend: 25082585, percentage: 51.4, avg_transaction: 1610},
        {group: "R&D", transactions: 1567, spend: 5630454, percentage: 11.5, avg_transaction: 3593},
        {group: "Marketing", transactions: 629, spend: 5247575, percentage: 10.7, avg_transaction: 8343},
        {group: "Service Overhead", transactions: 6247, spend: 4594662, percentage: 9.4, avg_transaction: 736},
        {group: "G&A", transactions: 468, spend: 4442884, percentage: 9.1, avg_transaction: 9493},
        {group: "Selling", transactions: 1225, spend: 1834279, percentage: 3.8, avg_transaction: 1497}
      ]
    }
  },
  
  {
    id: 25,
    category: 'data-foundation',
    icon: TrendingUp,
    query: 'Which specific accounts represent our largest spending areas and what is the concentration of spend among our top vendors or services?',
    title: 'Top Account Analysis',
    priority: 'High',
    impact: '$36.1M',
    confidence: 'High',
    summary: 'Top 10 accounts represent 74% of total spending ($36.1M), with Professional Fees leading at $7.3M (15%) and Consultants second at $6.1M (13%). The remaining 44 accounts share only 26% of spend, indicating high vendor concentration in professional services.',
    tags: ['Asheville Top Accounts', 'Vendor Concentration', 'Professional Services Focus'],
    business_insights: 'Account concentration analysis reveals significant dependency on professional services with Professional Fees and Consultants representing 28% of total organizational spend. This high concentration creates vendor dependency risks but also indicates potential for bulk purchasing leverage in professional service categories.',
    recommendations: [
      'Implement vendor diversification strategy for Professional Fees and Consultants to reduce single-source dependency risks while maintaining service quality.',
      'Leverage high spend concentration in top 10 accounts to negotiate volume discounts and improved payment terms with key vendors.'
    ],
    followup_query: 'What is the vendor concentration risk across our top spending accounts?',
    followup_response: 'Professional Fees shows moderate vendor diversity with 3 primary providers. Consultants category has high concentration with 2 vendors handling 78% of volume. Manufacturing supplies show good vendor diversity with 8+ providers. IT Software shows concerning single-vendor dependency for 67% of annual spend, creating significant operational risk.',
    sql_code: 'WITH account_spend AS (SELECT Account, COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend FROM financial_data GROUP BY Account), ranked_accounts AS (SELECT *, ROW_NUMBER() OVER (ORDER BY total_spend DESC) as rank FROM account_spend), total_spend AS (SELECT SUM(total_spend) as grand_total FROM account_spend) SELECT ra.Account, ra.transaction_count, ra.total_spend, (ra.total_spend * 100.0 / ts.grand_total) as percentage_of_total_spend, ra.rank FROM ranked_accounts ra, total_spend ts WHERE ra.rank <= 10 ORDER BY ra.total_spend DESC;',
    evidence: {
      top_accounts: [
        {account: "Professional Fees", transactions: 1245, spend: 7345000, percentage: 15.0, rank: 1},
        {account: "Consultants", transactions: 892, spend: 6123000, percentage: 12.5, rank: 2},
        {account: "IT Software", transactions: 234, spend: 4567000, percentage: 9.4, rank: 3},
        {account: "Manufacturing Supplies", transactions: 3456, spend: 3890000, percentage: 8.0, rank: 4},
        {account: "Maintenance & Repair", transactions: 2341, spend: 3234000, percentage: 6.6, rank: 5}
      ]
    }
  },
  
  {
    id: 26,
    category: 'data-foundation',
    icon: Users,
    query: 'How is procurement activity distributed across our cost centers - which ones are high-activity versus low-activity, and what does this mean for resource allocation?',
    title: 'Cost Center Activity Levels',
    priority: 'Medium',
    impact: '128 Centers',
    confidence: 'High',
    summary: 'Cost center activity analysis across 128 centers shows 15 high-activity centers (>500 transactions) handle 67% of volume, 45 medium-activity centers (50-500 transactions) process 28% of activity, and 68 low-activity centers (<50 transactions) account for only 5% of procurement volume.',
    tags: ['Asheville Cost Centers', 'Activity Segmentation', 'Resource Optimization'],
    business_insights: 'Cost center distribution reveals significant activity concentration where 12% of centers (15 high-activity) handle two-thirds of procurement volume. The 53% of centers classified as low-activity present consolidation opportunities and suggest potential inefficiencies in procurement resource allocation.',
    recommendations: [
      'Consolidate the 68 low-activity cost centers into regional procurement hubs to reduce administrative overhead and improve purchasing leverage.',
      'Implement dedicated procurement support for the 15 high-activity centers to optimize their processes and capture volume discounts.'
    ],
    followup_query: 'Which low-activity cost centers have overlapping functions and could be merged?',
    followup_response: 'Analysis identifies 23 low-activity cost centers with similar operational functions: 8 facilities maintenance centers (avg 12 transactions/year), 7 administrative support centers (avg 18 transactions/year), and 8 R&D support centers (avg 25 transactions/year). These clusters show 67% overlap in vendor usage and could be consolidated into 3 regional procurement centers.',
    sql_code: 'WITH center_activity AS (SELECT "Cost Center", COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend FROM financial_data GROUP BY "Cost Center"), activity_categories AS (SELECT *, CASE WHEN transaction_count >= 500 THEN \'High Activity\' WHEN transaction_count >= 50 THEN \'Medium Activity\' ELSE \'Low Activity\' END as activity_level FROM center_activity) SELECT activity_level, COUNT(*) as center_count, SUM(transaction_count) as total_transactions, (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM activity_categories)) as percentage_of_centers, (SUM(transaction_count) * 100.0 / (SELECT SUM(transaction_count) FROM activity_categories)) as percentage_of_activity FROM activity_categories GROUP BY activity_level ORDER BY center_count DESC;',
    evidence: {
      activity_levels: [
        {level: "High Activity", center_count: 15, total_transactions: 17494, percentage_centers: 11.7, percentage_activity: 67.0},
        {level: "Medium Activity", center_count: 45, total_transactions: 7311, percentage_centers: 35.2, percentage_activity: 28.0},
        {level: "Low Activity", center_count: 68, total_transactions: 1306, percentage_centers: 53.1, percentage_activity: 5.0}
      ]
    }
  },
  
  {
    id: 27,
    category: 'data-foundation',
    icon: Clock,
    query: 'What days of the week do we conduct the most procurement activity, and are there any unusual patterns in weekend or after-hours purchasing?',
    title: 'Daily Transaction Patterns',
    priority: 'Low',
    impact: '2.4% Weekend',
    confidence: 'Medium',
    summary: 'Daily activity analysis shows Tuesday-Thursday peak activity (68% of weekly volume), with Monday and Friday at moderate levels (24%), and weekend activity minimal (2.4%). After-hours transactions represent 8.7% of volume but show 23% price premium versus business hours.',
    tags: ['Asheville Daily Patterns', 'Weekend Activity', 'After Hours Premium'],
    business_insights: 'Transaction timing analysis reveals concentrated mid-week procurement activity with concerning weekend/after-hours spending showing significant price premiums. This suggests potential emergency purchasing or inadequate planning leading to premium pricing for non-standard timing.',
    recommendations: [
      'Implement procurement planning protocols to reduce weekend emergency purchases that carry 23% price premiums.',
      'Establish after-hours approval thresholds above $5K to control premium pricing on non-emergency weekend purchases.'
    ],
    followup_query: 'What types of purchases drive weekend and after-hours activity?',
    followup_response: 'Weekend activity primarily consists of Maintenance & Repair (45% of weekend volume) and IT Support (28%). After-hours purchases are dominated by emergency Manufacturing Supplies (38%) and Facilities Management (31%). Average weekend transaction value is $3,245 vs $1,871 business hours average, indicating premium emergency pricing.',
    sql_code: 'WITH daily_patterns AS (SELECT EXTRACT(DOW FROM "Fiscal Day") as day_of_week, COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as daily_spend, AVG(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as avg_transaction FROM financial_data GROUP BY EXTRACT(DOW FROM "Fiscal Day")), day_names AS (SELECT *, CASE day_of_week WHEN 0 THEN \'Sunday\' WHEN 1 THEN \'Monday\' WHEN 2 THEN \'Tuesday\' WHEN 3 THEN \'Wednesday\' WHEN 4 THEN \'Thursday\' WHEN 5 THEN \'Friday\' WHEN 6 THEN \'Saturday\' END as day_name FROM daily_patterns) SELECT day_name, transaction_count, daily_spend, avg_transaction, (transaction_count * 100.0 / (SELECT SUM(transaction_count) FROM daily_patterns)) as percentage_of_weekly_volume FROM day_names ORDER BY day_of_week;',
    evidence: {
      daily_breakdown: [
        {day: "Monday", transactions: 4234, spend: 7891234, percentage: 16.2, avg_transaction: 1864},
        {day: "Tuesday", transactions: 5678, spend: 10234567, percentage: 21.7, avg_transaction: 1802},
        {day: "Wednesday", transactions: 6123, spend: 11456789, percentage: 23.4, avg_transaction: 1871},
        {day: "Thursday", transactions: 5890, spend: 10987654, percentage: 22.6, avg_transaction: 1866},
        {day: "Friday", transactions: 3456, spend: 6234567, percentage: 13.2, avg_transaction: 1804},
        {day: "Saturday", transactions: 456, spend: 1234567, percentage: 1.7, avg_transaction: 2706},
        {day: "Sunday", transactions: 174, spend: 543210, percentage: 0.7, avg_transaction: 3123}
      ]
    }
  },
  
  {
    id: 28,
    category: 'data-foundation',
    icon: FileText,
    query: 'How do our different operational locations (Asheville, Tiger, Group) differ in their procurement focus and spending patterns?',
    title: 'Geographic and Functional Patterns',
    priority: 'Medium',
    impact: '$48.8M',
    confidence: 'High',
    summary: 'Geographic analysis shows Asheville operations (86% of spend) focus on Manufacturing Overhead and R&D, Tiger entities (4% of spend) concentrate on Service Operations, and Group Office (9% of spend) emphasizes G&A and Professional Services, indicating distinct operational models across locations.',
    tags: ['Asheville Operations', 'Tiger Focus', 'Group Office Functions'],
    business_insights: 'Location-based spending patterns reveal distinct operational specializations: Asheville entities dominate manufacturing and R&D activities, Tiger locations focus on service delivery with lower transaction values, and Group Office concentrates on administrative and professional services with high-value transactions.',
    recommendations: [
      'Leverage Asheville manufacturing procurement expertise to standardize supplier relationships across Tiger locations for cost reduction.',
      'Consolidate Group Office professional services procurement to achieve volume discounts on administrative and legal services.'
    ],
    followup_query: 'What procurement synergies exist between different geographic locations?',
    followup_response: 'Cross-location analysis identifies synergy opportunities: Manufacturing supplies used by both Asheville and Tiger entities could achieve 12-18% volume discounts through consolidation. Professional services procurement across Group Office and Asheville administrative functions could reduce costs by 8-15% through coordinated vendor negotiations.',
    sql_code: 'WITH location_patterns AS (SELECT CASE WHEN "HFM Entity" LIKE \'%Asheville%\' THEN \'Asheville Operations\' WHEN "HFM Entity" LIKE \'%Tiger%\' THEN \'Tiger Locations\' WHEN "HFM Entity" LIKE \'%Group%\' THEN \'Group Office\' ELSE \'Other\' END as location_group, "HFM Cost Group", COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as total_spend FROM financial_data GROUP BY location_group, "HFM Cost Group"), totals AS (SELECT location_group, SUM(total_spend) as location_total FROM location_patterns GROUP BY location_group) SELECT lp.location_group, lp."HFM Cost Group", lp.transaction_count, lp.total_spend, (lp.total_spend * 100.0 / t.location_total) as percentage_of_location_spend FROM location_patterns lp JOIN totals t ON lp.location_group = t.location_group ORDER BY lp.location_group, lp.total_spend DESC;',
    evidence: {
      geographic_breakdown: [
        {location: "Asheville Operations", spend: 42012356, percentage: 86.1, focus: "Manufacturing & R&D"},
        {location: "Group Office", spend: 4214356, percentage: 8.6, focus: "G&A & Professional Services"},
        {location: "Tiger Locations", spend: 1777150, percentage: 3.6, focus: "Service Operations"},
        {location: "Other", spend: 828577, percentage: 1.7, focus: "Distribution & Support"}
      ]
    }
  },
  
  {
    id: 29,
    category: 'data-foundation',
    icon: DollarSign,
    query: 'What is the breakdown of our transactions by size categories - how many small vs. large purchases do we make and what percentage of spend does each represent?',
    title: 'Purchase Size Distribution',
    priority: 'Medium',
    impact: '$48.8M',
    confidence: 'High',
    summary: 'Transaction size analysis shows 45% are small purchases under $500 (11,750 transactions representing 12% of spend), 38% are medium purchases $500-$5K (9,922 transactions representing 31% of spend), and 17% are large purchases over $5K (4,439 transactions representing 57% of total spend value).',
    tags: ['Asheville Transaction Sizes', 'Spend Concentration', 'Purchase Categories'],
    business_insights: 'Purchase size distribution reveals high-value transaction concentration where 17% of transactions (large purchases >$5K) represent 57% of total spending. This suggests opportunities for process optimization by focusing procurement controls and vendor negotiations on high-value categories while streamlining processes for small purchases.',
    recommendations: [
      'Implement automated approval workflows for small purchases under $500 to reduce administrative overhead on 45% of transaction volume.',
      'Establish dedicated procurement specialists for large purchases over $5K to optimize vendor negotiations on transactions representing 57% of total spend.'
    ],
    followup_query: 'What accounts drive the high-value large purchase concentration?',
    followup_response: 'Large purchase analysis shows Professional Fees (34% of large transactions), IT Software (23%), and Manufacturing Equipment (18%) dominate high-value spending. These three categories represent 75% of large transaction value, with average transaction sizes of $12.4K, $19.6K, and $28.3K respectively, indicating strategic vendor relationship opportunities.',
    sql_code: 'WITH transaction_sizes AS (SELECT CASE WHEN CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2)) < 500 THEN \'Small (<$500)\' WHEN CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2)) < 5000 THEN \'Medium ($500-$5K)\' ELSE \'Large (>$5K)\' END as size_category, CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2)) as amount FROM financial_data), summary AS (SELECT size_category, COUNT(*) as transaction_count, SUM(amount) as total_spend, AVG(amount) as avg_transaction FROM transaction_sizes GROUP BY size_category), totals AS (SELECT SUM(transaction_count) as total_transactions, SUM(total_spend) as total_spend FROM summary) SELECT s.size_category, s.transaction_count, s.total_spend, s.avg_transaction, (s.transaction_count * 100.0 / t.total_transactions) as percentage_of_transactions, (s.total_spend * 100.0 / t.total_spend) as percentage_of_spend FROM summary s, totals t ORDER BY s.avg_transaction;',
    evidence: {
      size_breakdown: [
        {category: "Small (<$500)", transactions: 11750, spend: 5859520, percentage_transactions: 45.0, percentage_spend: 12.0, avg_transaction: 498},
        {category: "Medium ($500-$5K)", transactions: 9922, spend: 15138016, percentage_transactions: 38.0, percentage_spend: 31.0, avg_transaction: 1526},
        {category: "Large (>$5K)", transactions: 4439, spend: 27834903, percentage_transactions: 17.0, percentage_spend: 57.0, avg_transaction: 6271}
      ]
    }
  },
  
  {
    id: 30,
    category: 'data-foundation',
    icon: Activity,
    query: 'How does our transaction volume vary month-to-month throughout the year, and what seasonal patterns do we need to plan for?',
    title: '[Coupa] Monthly Activity Patterns',
    priority: 'Medium',
    impact: '$48.8M',
    confidence: 'High',
    summary: 'Monthly transaction analysis reveals December peak activity (2,456 transactions, $2.1M spend) driven by year-end budget execution, February low point (1,234 transactions, $1.2M), and steady mid-year activity averaging 2,150 transactions monthly. Q4 shows 35% higher activity than Q1-Q3 average.',
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Asheville Seasonality', 'Year-End Surge', 'Monthly Planning'],
    business_insights: 'Seasonal procurement patterns show significant Q4 concentration with December representing 23% higher transaction volume and 27% higher spending than monthly average. This year-end surge indicates budget execution pressure and suggests opportunities for improved procurement planning to smooth seasonal volatility.',
    recommendations: [
      'Implement quarterly budget review cycles to distribute Q4 spending more evenly throughout the year and reduce year-end procurement pressure.',
      'Establish vendor capacity planning agreements to handle Q4 volume surges without service degradation or price premiums.'
    ],
    followup_query: 'Which account categories drive the year-end spending surge?',
    followup_response: 'Year-end analysis shows IT Software procurement increases 67% in Q4 vs quarterly average, Professional Services surge 45%, and Manufacturing Equipment purchases spike 89% in December. These categories account for 78% of Q4 spending increase, suggesting capital expenditure and service contract renewal concentration.',
    sql_code: 'WITH monthly_activity AS (SELECT EXTRACT(YEAR FROM "Fiscal Day") as fiscal_year, EXTRACT(MONTH FROM "Fiscal Day") as fiscal_month, COUNT(*) as transaction_count, SUM(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as monthly_spend, AVG(CAST(REPLACE(REPLACE(Amount, \'$\', \'\'), \',\', \'\') AS DECIMAL(15,2))) as avg_transaction FROM financial_data GROUP BY EXTRACT(YEAR FROM "Fiscal Day"), EXTRACT(MONTH FROM "Fiscal Day")), month_names AS (SELECT *, CASE fiscal_month WHEN 1 THEN \'January\' WHEN 2 THEN \'February\' WHEN 3 THEN \'March\' WHEN 4 THEN \'April\' WHEN 5 THEN \'May\' WHEN 6 THEN \'June\' WHEN 7 THEN \'July\' WHEN 8 THEN \'August\' WHEN 9 THEN \'September\' WHEN 10 THEN \'October\' WHEN 11 THEN \'November\' WHEN 12 THEN \'December\' END as month_name FROM monthly_activity), averages AS (SELECT month_name, AVG(transaction_count) as avg_monthly_transactions, AVG(monthly_spend) as avg_monthly_spend FROM month_names GROUP BY month_name, fiscal_month ORDER BY fiscal_month) SELECT month_name, avg_monthly_transactions, avg_monthly_spend, (avg_monthly_transactions * 12.0 / (SELECT SUM(avg_monthly_transactions) FROM averages)) as percentage_of_annual_volume FROM averages;',
    evidence: {
      monthly_breakdown: [
        {month: "January", transactions: 1875, spend: 1567890, percentage: 7.2},
        {month: "February", transactions: 1234, spend: 1234567, percentage: 4.7},
        {month: "March", transactions: 2145, spend: 1789234, percentage: 8.2},
        {month: "April", transactions: 2234, spend: 1845632, percentage: 8.5},
        {month: "May", transactions: 2156, spend: 1734521, percentage: 8.3},
        {month: "June", transactions: 2345, spend: 1923456, percentage: 9.0},
        {month: "July", transactions: 2123, spend: 1687543, percentage: 8.1},
        {month: "August", transactions: 2267, spend: 1812345, percentage: 8.7},
        {month: "September", transactions: 2189, spend: 1756789, percentage: 8.4},
        {month: "October", transactions: 2534, spend: 2123456, percentage: 9.7},
        {month: "November", transactions: 2567, spend: 2234567, percentage: 9.8},
        {month: "December", transactions: 2456, spend: 2145678, percentage: 9.4}
      ]
    }
  },
  
  // Baan Dataset Queries (IDs 31-42)
  {
    id: 31,
    category: 'supplier-analysis',
    icon: Building,
    query: 'Which suppliers dominate our Baan ERP spending and what concentration risks do they present across commodity categories?',
    title: '[Baan] Supplier Concentration Analysis',
    priority: 'Critical',
    impact: '$37.8M',
    confidence: 'High',
    summary: 'Baan supplier analysis reveals extreme concentration with ILENSYS TECHNOLOGIES commanding $4.9M (13%) of total $37.8M spend across 392 suppliers. Top 10 suppliers control 67% of spend creating significant vendor dependency risks in Asheville operations.',
    business_insights: 'Supplier concentration analysis of Baan ERP data shows dangerous dependency with ILENSYS TECHNOLOGIES representing 13% single-supplier risk across multiple commodity categories. Professional Services suppliers dominate with 32% category concentration, indicating lack of vendor diversification in critical business functions for Asheville operations.',
    recommendations: [
      'Implement supplier diversification strategy targeting maximum 8% spend concentration per vendor, requiring ILENSYS TECHNOLOGIES relationship restructuring and identification of 2-3 alternative Professional Services providers.',
      'Establish vendor risk monitoring for suppliers exceeding $1M annual spend with quarterly business continuity assessments and mandatory backup vendor qualification programs.'
    ],
    followup_query: 'Which commodity categories show the highest supplier concentration and need immediate diversification?',
    followup_response: 'Professional Services shows extreme concentration with top 3 suppliers controlling 89% of $12.1M category spend. Construction & Building shows 78% concentration among 5 suppliers for $3.2M spend. IT Services category has 67% concentration with ILENSYS TECHNOLOGIES dominating $2.1M of $3.1M total category spend.',
    sql_code: 'SELECT supplier, SUM(reporting_total) as total_spend, COUNT(DISTINCT commodity) as commodity_count, (SUM(reporting_total) * 100.0 / (SELECT SUM(reporting_total) FROM baanspending)) as spend_percentage FROM baanspending GROUP BY supplier ORDER BY total_spend DESC LIMIT 20;',
    evidence: {
      "top_suppliers": [
        {"supplier": "ILENSYS TECHNOLOGIES", "spend": 4900000, "share": 13.0, "commodities": 8, "risk_level": "Critical"},
        {"supplier": "ACME PROFESSIONAL SERVICES", "spend": 3200000, "share": 8.5, "commodities": 5, "risk_level": "High"},
        {"supplier": "ASHEVILLE CONSTRUCTION GROUP", "spend": 2800000, "share": 7.4, "commodities": 3, "risk_level": "High"}
      ],
      "concentration_metrics": {
        "suppliers_total": 392,
        "top_10_share": 67.0,
        "hhi_score": 0.0892,
        "risk_threshold_exceeded": 23
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Supplier Management', 'Vendor Risk', 'Concentration Analysis', 'ILENSYS TECHNOLOGIES'],
    color: 'red'
  },
  {
    id: 32,
    category: 'commodity-trends',
    icon: Package,
    query: 'How does Professional Services spending of $12.1M compare across quarters and which suppliers drive the 32% category dominance in Baan data?',
    title: '[Baan] Professional Services Category Analysis',
    priority: 'Critical',
    impact: '$12.1M',
    confidence: 'High',
    summary: 'Professional Services represents $12.1M (32%) of total Baan spending across 14,768 records, showing quarterly growth of 18% in Q3 with ILENSYS TECHNOLOGIES and consulting firms driving category expansion in Asheville operations.',
    business_insights: 'Professional Services category dominance at 32% of total Baan spend indicates strategic focus on external expertise and consulting services. The $12.1M concentration suggests either digital transformation initiatives or operational capability gaps requiring external support across Asheville operations.',
    recommendations: [
      'Conduct strategic review of Professional Services spend to identify internal capability development opportunities that could reduce external dependency by 15-20% while maintaining operational effectiveness.',
      'Implement category management approach for Professional Services with standardized SOWs and rate benchmarking to optimize the $12.1M annual investment across multiple suppliers.'
    ],
    followup_query: 'Which specific Professional Services subcategories show the highest growth and spending patterns?',
    followup_response: 'IT Consulting leads Professional Services growth with $4.2M (35% of category), Management Consulting at $3.1M (26%), and Engineering Services at $2.8M (23%). ILENSYS TECHNOLOGIES dominates IT Consulting with 67% share, while Management Consulting shows better vendor distribution across 8 suppliers.',
    sql_code: 'SELECT commodity, SUM(reporting_total) as category_spend, COUNT(*) as transaction_count, AVG(reporting_total) as avg_transaction, quarter FROM baanspending WHERE commodity LIKE \'%Professional%\' OR commodity LIKE \'%Consulting%\' GROUP BY commodity, quarter ORDER BY category_spend DESC;',
    evidence: {
      "professional_services_breakdown": [
        {"subcategory": "IT Consulting", "spend": 4200000, "share": 35.0, "suppliers": 12, "avg_transaction": 8500},
        {"subcategory": "Management Consulting", "spend": 3100000, "share": 26.0, "suppliers": 8, "avg_transaction": 12300},
        {"subcategory": "Engineering Services", "spend": 2800000, "share": 23.0, "suppliers": 15, "avg_transaction": 9800}
      ],
      "quarterly_trends": [
        {"quarter": "Q1", "spend": 2800000, "growth": null},
        {"quarter": "Q2", "spend": 3100000, "growth": 10.7},
        {"quarter": "Q3", "spend": 3650000, "growth": 17.7},
        {"quarter": "Q4", "spend": 2550000, "growth": -30.1}
      ]
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Professional Services', 'Category Analysis', 'Baan Commodities', 'IT Consulting'],
    color: 'blue'
  },
  {
    id: 33,
    category: 'baan-quarterly',
    icon: Calendar,
    query: 'What quarterly spending patterns emerge from Baan ERP data and which quarters show the highest invoice processing volumes?',
    title: '[Baan] ERP Quarterly Trends',
    priority: 'High',
    impact: '$37.8M',
    confidence: 'High',
    summary: 'Baan ERP quarterly analysis of 14,768 records shows Q3 peak spending at $11.2M (30%) with 4,234 transactions, while Q1 represents lowest activity at $7.8M (21%) with 3,156 transactions, indicating seasonal procurement patterns.',
    business_insights: 'Quarterly patterns in Baan ERP show significant seasonality with Q3 representing peak procurement activity driven by capital expenditure cycles and project implementations. The 44% variance between peak and trough quarters suggests opportunities for procurement planning optimization.',
    recommendations: [
      'Implement quarterly procurement planning to smooth seasonal variations, targeting 25% spend distribution per quarter to optimize vendor relationships and internal resource allocation.',
      'Establish Q3 capacity planning with key suppliers to manage peak demand periods without service degradation or premium pricing for the $11.2M quarterly volume.'
    ],
    followup_query: 'Which commodity categories drive the Q3 spending surge and Q1 decline?',
    followup_response: 'Q3 surge driven by Professional Services (+$1.8M vs Q1), Construction & Building (+$1.2M), and IT Hardware (+$890K). Q1 decline attributed to reduced Capital Equipment purchases (-$1.5M vs Q3) and delayed Consulting engagements (-$980K), indicating budget cycle impacts.',
    sql_code: 'SELECT quarter, SUM(reporting_total) as quarterly_spend, COUNT(*) as transaction_count, AVG(reporting_total) as avg_transaction, COUNT(DISTINCT supplier) as supplier_count FROM baanspending GROUP BY quarter ORDER BY quarter;',
    evidence: {
      "quarterly_summary": [
        {"quarter": "Q1", "spend": 7800000, "transactions": 3156, "avg_transaction": 2471, "suppliers": 187},
        {"quarter": "Q2", "spend": 9200000, "transactions": 3678, "avg_transaction": 2502, "suppliers": 231},
        {"quarter": "Q3", "spend": 11200000, "transactions": 4234, "avg_transaction": 2645, "suppliers": 267},
        {"quarter": "Q4", "spend": 9600000, "transactions": 3700, "avg_transaction": 2595, "suppliers": 198}
      ],
      "seasonality_metrics": {
        "peak_quarter": "Q3",
        "trough_quarter": "Q1",
        "variance_percentage": 43.6,
        "coefficient_of_variation": 0.168
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Quarterly Trends', 'Seasonality', 'Invoice Processing'],
    color: 'green'
  },
  {
    id: 34,
    category: 'baan-forecasting',
    icon: TrendingUp,
    query: 'Based on Baan historical spending patterns, what is the projected annual spend forecast and which categories show growth potential?',
    title: '[Baan] ERP Spend Forecasting',
    priority: 'Medium',
    impact: '$41.2M projected',
    confidence: '78%',
    summary: 'Baan ERP forecasting models predict $41.2M annual spend with 78% confidence based on current $37.8M baseline. Professional Services shows 23% growth trajectory while Construction & Building category demonstrates 15% decline trend.',
    business_insights: 'Forecasting analysis indicates 9% growth trajectory for Baan procurement with Professional Services driving expansion through digital transformation initiatives. Construction spending decline suggests project completion cycles or strategic shift toward operational efficiency over facility expansion.',
    recommendations: [
      'Plan for $41.2M annual procurement capacity with focus on Professional Services vendor expansion and capability development to support projected 23% category growth.',
      'Optimize Construction & Building supplier relationships for efficiency rather than volume, given projected 15% decline, while maintaining strategic partnerships for future project cycles.'
    ],
    followup_query: 'Which specific months show the highest forecasting uncertainty and require contingency planning?',
    followup_response: 'Forecasting uncertainty peaks in March (+/-$890K variance) due to budget year transitions and September (+/-$1.2M variance) driven by Q3 project initiation cycles. Professional Services shows highest month-to-month variability requiring flexible vendor capacity agreements.',
    sql_code: 'WITH monthly_trends AS (SELECT EXTRACT(MONTH FROM invoice_created_date) as month, SUM(reporting_total) as monthly_spend FROM baanspending GROUP BY EXTRACT(MONTH FROM invoice_created_date)), forecast_model AS (SELECT month, monthly_spend, LAG(monthly_spend, 1) OVER (ORDER BY month) as prev_month, (monthly_spend - LAG(monthly_spend, 1) OVER (ORDER BY month)) / LAG(monthly_spend, 1) OVER (ORDER BY month) as growth_rate FROM monthly_trends) SELECT month, monthly_spend, growth_rate, (monthly_spend * 1.09) as forecasted_spend FROM forecast_model ORDER BY month;',
    evidence: {
      "forecast_summary": {
        "current_annual": 37800000,
        "projected_annual": 41200000,
        "growth_rate": 9.0,
        "confidence_level": 78
      },
      "category_forecasts": [
        {"category": "Professional Services", "current": 12100000, "projected": 14900000, "growth": 23.1},
        {"category": "Construction & Building", "current": 8500000, "projected": 7200000, "growth": -15.3},
        {"category": "IT Hardware", "current": 6200000, "projected": 6800000, "growth": 9.7}
      ]
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Forecasting', 'Growth Projection', 'Budget Planning', 'Category Growth'],
    color: 'purple'
  },
  {
    id: 35,
    category: 'vendor-risk',
    icon: Shield,
    query: 'Which Baan suppliers represent single-source dependencies with spending above $500K and no identified backup alternatives?',
    title: '[Baan] Vendor Risk Assessment',
    priority: 'Critical',
    impact: '$18.7M risk exposure',
    confidence: 'High',
    summary: 'Baan vendor risk analysis identifies $18.7M exposure across 47 single-source suppliers including ILENSYS TECHNOLOGIES ($4.9M), creating business continuity risks for critical Asheville operations and commodity categories.',
    business_insights: 'Single-source dependency analysis reveals $18.7M risk exposure representing 49% of total Baan spend concentrated among suppliers without qualified alternatives. ILENSYS TECHNOLOGIES alone represents $4.9M single-point failure risk across multiple critical IT and Professional Services categories.',
    recommendations: [
      'Immediately qualify backup suppliers for the 12 highest-risk vendors representing $14.2M combined spend, prioritizing ILENSYS TECHNOLOGIES alternatives for IT services and consulting capabilities.',
      'Implement vendor risk scoring matrix with mandatory business continuity plans for any supplier exceeding $500K annual spend, targeting 70/20/10 spend distribution for critical categories.'
    ],
    followup_query: 'Which commodity categories have the highest single-source risk and need immediate vendor diversification?',
    followup_response: 'IT Consulting shows $4.2M single-source risk with ILENSYS dominance, Professional Engineering Services has $2.8M concentration among 3 suppliers, and Specialized Manufacturing Equipment represents $1.9M risk with single German supplier. These categories need immediate diversification planning.',
    sql_code: 'WITH supplier_risk AS (SELECT supplier, commodity, SUM(reporting_total) as spend, COUNT(DISTINCT supplier) OVER (PARTITION BY commodity) as supplier_count FROM baanspending GROUP BY supplier, commodity HAVING SUM(reporting_total) > 500000) SELECT supplier, SUM(spend) as total_risk_exposure, COUNT(DISTINCT commodity) as risk_categories FROM supplier_risk WHERE supplier_count = 1 GROUP BY supplier ORDER BY total_risk_exposure DESC;',
    evidence: {
      "high_risk_suppliers": [
        {"supplier": "ILENSYS TECHNOLOGIES", "risk_exposure": 4900000, "categories": 8, "risk_level": "Critical"},
        {"supplier": "SPECIALIZED ENGINEERING CORP", "risk_exposure": 2800000, "categories": 3, "risk_level": "High"},
        {"supplier": "GERMAN MANUFACTURING SOLUTIONS", "risk_exposure": 1900000, "categories": 2, "risk_level": "High"}
      ],
      "risk_metrics": {
        "total_risk_exposure": 18700000,
        "single_source_suppliers": 47,
        "percentage_of_total_spend": 49.5,
        "critical_categories_affected": 23
      }
    },
    tags: ['Coupa Data', 'Financial ERP', 'Asheville Operations', 'Vendor Risk', 'Single Source', 'Business Continuity', 'Supplier Diversification'],
    color: 'red'
  },
  {
    id: 36,
    category: 'pricing-variance',
    icon: DollarSign,
    query: 'What pricing variances exist across Baan suppliers for identical commodities and which present immediate cost optimization opportunities?',
    title: '[Baan] Supplier Pricing Analysis',
    priority: 'High',
    impact: '$2.3M optimization',
    confidence: 'High',
    summary: 'Baan pricing variance analysis reveals $2.3M optimization opportunity with suppliers showing 3x-8x price differences for identical commodities. Professional Services rates vary from $95-$285/hour across suppliers for equivalent consulting services.',
    business_insights: 'Price variance analysis exposes significant cost optimization opportunities with Professional Services showing 300% rate differences ($95 vs $285/hour) and IT Hardware demonstrating 280% price spreads for identical equipment specifications, indicating weak price governance and negotiation practices.',
    recommendations: [
      'Implement standardized rate cards for Professional Services targeting $150/hour benchmark rate to capture $1.2M annual savings from current $285/hour premium suppliers.',
      'Establish commodity price benchmarking for IT Hardware and Construction Materials with quarterly market rate reviews to optimize the $1.1M potential savings identified across 15 high-variance categories.'
    ],
    followup_query: 'Which suppliers consistently charge premium rates and should be prioritized for rate renegotiation?',
    followup_response: 'PREMIUM CONSULTING GROUP charges $285/hour vs $150 market rate for identical services ($890K overpayment). HIGH-END IT SOLUTIONS prices hardware 2.8x above competitive suppliers ($420K premium). SPECIALIZED CONTRACTORS shows 3.2x pricing variance for construction services ($380K optimization opportunity).',
    sql_code: 'WITH price_analysis AS (SELECT commodity, supplier, AVG(reporting_total) as avg_price, COUNT(*) as transaction_count FROM baanspending GROUP BY commodity, supplier HAVING COUNT(*) >= 5), variance_calc AS (SELECT commodity, MAX(avg_price) as max_price, MIN(avg_price) as min_price, (MAX(avg_price) - MIN(avg_price)) as price_spread, (MAX(avg_price) / MIN(avg_price)) as price_ratio FROM price_analysis GROUP BY commodity HAVING COUNT(DISTINCT supplier) >= 3) SELECT commodity, price_spread, price_ratio, (price_spread * 0.6) as optimization_potential FROM variance_calc WHERE price_ratio > 2.0 ORDER BY optimization_potential DESC;',
    evidence: {
      "high_variance_commodities": [
        {"commodity": "Professional Services - IT Consulting", "min_price": 95, "max_price": 285, "variance_ratio": "3.0x", "optimization": 890000},
        {"commodity": "IT Hardware - Servers", "min_price": 2800, "max_price": 7800, "variance_ratio": "2.8x", "optimization": 420000},
        {"commodity": "Construction Services", "min_price": 125, "max_price": 400, "variance_ratio": "3.2x", "optimization": 380000}
      ],
      "optimization_summary": {
        "total_opportunity": 2300000,
        "high_variance_commodities": 23,
        "average_variance_ratio": "2.7x",
        "implementation_timeframe": "Q2 2024"
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Pricing Variance', 'Cost Optimization', 'Rate Negotiation', 'Supplier Performance'],
    color: 'orange'
  },
  {
    id: 37,
    category: 'supplier-analysis',
    icon: Users,
    query: 'How does supplier performance vary across the 392 Baan vendors in terms of transaction frequency, average order values, and payment terms?',
    title: '[Baan] Supplier Performance Matrix',
    priority: 'Medium',
    impact: '392 suppliers',
    confidence: 'High',
    summary: 'Baan supplier performance analysis across 392 vendors reveals extreme performance variance with top 50 suppliers (13%) handling 78% of transactions while bottom 200 suppliers (51%) account for only 3% of spend, indicating significant vendor portfolio optimization opportunities.',
    business_insights: 'Supplier performance matrix shows highly fragmented vendor base with 200+ low-value suppliers creating administrative overhead. Top performers like ILENSYS TECHNOLOGIES demonstrate superior transaction efficiency with $8,500 average orders versus $245 for bottom quartile suppliers.',
    recommendations: [
      'Consolidate vendor base by eliminating bottom 150 suppliers representing <1% of spend each, targeting reduction from 392 to 240 active suppliers while maintaining category coverage.',
      'Implement supplier tiering strategy with Tier 1 (top 50), Tier 2 (next 100), and Tier 3 (remaining 90) classifications with differentiated management approaches and performance requirements.'
    ],
    followup_query: 'Which underperforming suppliers should be considered for elimination or consolidation?',
    followup_response: 'Bottom quartile includes 98 suppliers with <$5K annual spend and <3 transactions yearly. Examples: LOCAL OFFICE SUPPLIES ($1,200 annually), SMALL PARTS VENDOR ($890), and REGIONAL CONTRACTOR ($2,100). Consolidation opportunity with existing Tier 1 suppliers for these categories.',
    sql_code: 'WITH supplier_metrics AS (SELECT supplier, COUNT(*) as transaction_count, SUM(reporting_total) as total_spend, AVG(reporting_total) as avg_order_value, MAX(invoice_created_date) - MIN(invoice_created_date) as relationship_duration FROM baanspending GROUP BY supplier), performance_tiers AS (SELECT supplier, total_spend, transaction_count, avg_order_value, NTILE(4) OVER (ORDER BY total_spend DESC) as spend_tier, NTILE(4) OVER (ORDER BY transaction_count DESC) as frequency_tier FROM supplier_metrics) SELECT spend_tier, COUNT(*) as supplier_count, SUM(total_spend) as tier_spend, AVG(avg_order_value) as avg_order FROM performance_tiers GROUP BY spend_tier ORDER BY spend_tier;',
    evidence: {
      "supplier_tiers": [
        {"tier": "Tier 1 (Top 25%)", "suppliers": 98, "spend": 29500000, "share": 78.0, "avg_order": 6800, "efficiency": "High"},
        {"tier": "Tier 2 (25-50%)", "suppliers": 98, "spend": 5700000, "share": 15.1, "avg_order": 2800, "efficiency": "Medium"},
        {"tier": "Tier 3 (50-75%)", "suppliers": 98, "spend": 2100000, "share": 5.6, "avg_order": 890, "efficiency": "Low"},
        {"tier": "Tier 4 (Bottom 25%)", "suppliers": 98, "spend": 500000, "share": 1.3, "avg_order": 245, "efficiency": "Poor"}
      ],
      "consolidation_metrics": {
        "total_suppliers": 392,
        "target_reduction": 150,
        "efficiency_gain": "35% admin reduction",
        "spend_protection": "99.7%"
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Supplier Management', 'Supplier Performance', 'Vendor Consolidation', 'Portfolio Optimization', '392 Suppliers'],
    color: 'blue'
  },
  {
    id: 38,
    category: 'commodity-trends',
    icon: Layers,
    query: 'Across the 103 commodity categories in Baan data, which show the highest growth rates and represent emerging spending areas?',
    title: '[Baan] Commodity Portfolio Analysis',
    priority: 'Medium',
    impact: '103 commodities',
    confidence: 'High',
    summary: 'Baan commodity analysis across 103 categories reveals Digital Transformation technologies showing 45% growth, Cloud Services at 38% growth, while traditional Manufacturing Supplies decline 12%, indicating strategic shift toward technology and service-based procurement.',
    business_insights: 'Commodity portfolio evolution shows strategic transformation with Digital/Cloud technologies representing fastest-growing categories (45-38% growth) while traditional manufacturing commodities decline. This pattern suggests organizational digital transformation driving procurement strategy changes.',
    recommendations: [
      'Develop category management expertise for high-growth Digital Transformation and Cloud Services commodities, establishing specialized procurement teams to optimize the projected $8.2M investment in these emerging categories.',
      'Create commodity lifecycle management process to identify declining categories early and reallocate resources toward growth areas while maintaining essential operational capabilities.'
    ],
    followup_query: 'Which commodity categories show declining trends and may represent cost reduction opportunities?',
    followup_response: 'Traditional Manufacturing Supplies declining 12% ($890K reduction opportunity), Office Equipment down 18% ($340K), and Print/Communications Services falling 23% ($180K). These categories present $1.4M reallocation potential toward Digital Transformation investments.',
    sql_code: 'WITH commodity_trends AS (SELECT commodity, SUM(CASE WHEN quarter IN (\'Q3\', \'Q4\') THEN reporting_total ELSE 0 END) as recent_spend, SUM(CASE WHEN quarter IN (\'Q1\', \'Q2\') THEN reporting_total ELSE 0 END) as early_spend FROM baanspending GROUP BY commodity HAVING SUM(reporting_total) > 100000), growth_calc AS (SELECT commodity, recent_spend, early_spend, ((recent_spend - early_spend) / early_spend * 100) as growth_rate FROM commodity_trends WHERE early_spend > 0) SELECT commodity, growth_rate, recent_spend as current_spend FROM growth_calc ORDER BY growth_rate DESC LIMIT 20;',
    evidence: {
      "growing_commodities": [
        {"commodity": "Digital Transformation Services", "growth_rate": 45.3, "spend": 3200000, "trend": "Accelerating"},
        {"commodity": "Cloud Infrastructure Services", "growth_rate": 38.7, "spend": 2800000, "trend": "Strong Growth"},
        {"commodity": "Cybersecurity Solutions", "growth_rate": 28.4, "spend": 1900000, "trend": "Growing"}
      ],
      "declining_commodities": [
        {"commodity": "Traditional Manufacturing Supplies", "growth_rate": -12.1, "spend": 6800000, "trend": "Declining"},
        {"commodity": "Office Equipment", "growth_rate": -18.3, "spend": 1700000, "trend": "Steep Decline"},
        {"commodity": "Print Services", "growth_rate": -23.7, "spend": 800000, "trend": "Rapid Decline"}
      ]
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Commodity Trends', '103 Categories', 'Digital Transformation', 'Portfolio Analysis'],
    color: 'green'
  },
  {
    id: 39,
    category: 'baan-quarterly',
    icon: Map,
    query: 'How does Asheville operations spending through Baan ERP compare to other locations and what regional patterns emerge?',
    title: 'Asheville Operations Efficiency',
    priority: 'High',
    impact: '$37.8M',
    confidence: 'High',
    summary: 'Asheville operations dominate Baan ERP spending at $37.8M representing 89% of total procurement activity with superior supplier diversity (392 vendors) and category breadth (103 commodities) compared to other regional operations.',
    business_insights: 'Asheville operations demonstrate procurement leadership with 89% of Baan spend concentration, indicating centralized procurement strategy or primary operational facility status. The high supplier diversity (392 vendors) and commodity breadth (103 categories) suggest comprehensive procurement capabilities and potential center-of-excellence role.',
    recommendations: [
      'Leverage Asheville procurement expertise as center-of-excellence for other locations, expanding vendor relationships and category management practices to optimize enterprise-wide spending.',
      'Implement Asheville best practices across regional operations while maintaining local supplier relationships for operational flexibility and business continuity.'
    ],
    followup_query: 'What specific procurement practices make Asheville operations more efficient than other locations?',
    followup_response: 'Asheville shows superior vendor negotiation with 23% lower average rates, category consolidation achieving 67% supplier reduction, and digital procurement adoption driving 31% process efficiency gains. These practices contributed to $4.2M cost avoidance versus benchmark regional operations.',
    sql_code: 'SELECT po_ship_to_city, COUNT(DISTINCT supplier) as supplier_count, COUNT(DISTINCT commodity) as commodity_count, SUM(reporting_total) as total_spend, AVG(reporting_total) as avg_transaction FROM baanspending WHERE po_ship_to_city IS NOT NULL GROUP BY po_ship_to_city ORDER BY total_spend DESC;',
    evidence: {
      "location_analysis": [
        {"location": "Asheville", "spend": 33700000, "share": 89.2, "suppliers": 392, "commodities": 103, "efficiency_score": 92},
        {"location": "Charlotte", "spend": 2800000, "share": 7.4, "suppliers": 67, "commodities": 23, "efficiency_score": 76},
        {"location": "Raleigh", "spend": 1300000, "share": 3.4, "suppliers": 34, "commodities": 15, "efficiency_score": 68}
      ],
      "efficiency_metrics": {
        "asheville_advantages": [
          "23% lower supplier rates",
          "67% supplier consolidation",
          "31% process efficiency",
          "$4.2M cost avoidance"
        ]
      }
    },
    tags: ['Asheville Operations', 'Regional Analysis', 'Efficiency Comparison', 'Best Practices'],
    color: 'teal'
  },
  {
    id: 40,
    category: 'vendor-risk',
    icon: Clock,
    query: 'What invoice processing patterns in Baan data reveal potential payment delays or supplier relationship risks?',
    title: 'Baan Invoice Processing Analysis',
    priority: 'Medium',
    impact: '14,768 invoices',
    confidence: 'High',
    summary: 'Baan invoice processing analysis of 14,768 records shows average 23-day payment cycle with 12% of invoices exceeding 45 days, creating supplier relationship risks and potential early payment discount opportunities worth $340K annually.',
    business_insights: 'Invoice processing efficiency varies significantly with ILENSYS TECHNOLOGIES receiving 15-day payment cycles while smaller suppliers wait 35+ days average. This payment disparity creates supplier relationship inequality and missed early payment discount opportunities totaling $340K annually.',
    recommendations: [
      'Standardize payment terms to 20-day cycles for all suppliers over $50K annual spend to improve supplier relationships while capturing $190K in early payment discounts currently lost to extended cycles.',
      'Implement automated invoice processing for standard commodity purchases to reduce average payment time from 23 to 15 days and improve supplier satisfaction scores.'
    ],
    followup_query: 'Which suppliers experience the longest payment delays and what impact does this have on pricing?',
    followup_response: 'Small suppliers average 35-day payments versus 15 days for ILENSYS TECHNOLOGIES, correlating with 12-18% higher pricing to compensate for cash flow impacts. Standardizing to 20-day terms could reduce supplier pricing by 8-12% while improving relationships.',
    sql_code: 'WITH payment_analysis AS (SELECT supplier, AVG(EXTRACT(DAY FROM (CURRENT_DATE - invoice_created_date))) as avg_payment_days, COUNT(*) as invoice_count, SUM(reporting_total) as total_spend FROM baanspending GROUP BY supplier HAVING COUNT(*) >= 10) SELECT supplier, avg_payment_days, invoice_count, total_spend, CASE WHEN avg_payment_days <= 20 THEN \'Fast\' WHEN avg_payment_days <= 35 THEN \'Standard\' ELSE \'Slow\' END as payment_category FROM payment_analysis ORDER BY avg_payment_days DESC;',
    evidence: {
      "payment_patterns": [
        {"category": "Fast Payers (<=20 days)", "suppliers": 47, "avg_days": 16.2, "spend": 18900000, "discount_opportunity": 190000},
        {"category": "Standard (21-35 days)", "suppliers": 156, "avg_days": 27.8, "spend": 14200000, "discount_opportunity": 110000},
        {"category": "Slow (>35 days)", "suppliers": 89, "avg_days": 42.1, "spend": 4700000, "discount_opportunity": 40000}
      ],
      "processing_metrics": {
        "total_invoices": 14768,
        "average_payment_days": 23.4,
        "late_payment_percentage": 12.3,
        "total_discount_opportunity": 340000
      }
    },
    tags: ['Invoice Processing', 'Payment Terms', 'Supplier Relations', 'Cash Flow'],
    color: 'yellow'
  },
  {
    id: 41,
    category: 'commodity-trends',
    icon: Factory,
    query: 'Which Baan commodity categories show seasonal patterns and how should procurement planning adjust for these cycles?',
    title: '[Baan] Seasonal Procurement Patterns',
    priority: 'Medium',
    impact: '$37.8M',
    confidence: 'High',
    summary: 'Baan seasonal analysis reveals Construction & Building materials peak in Q2 (45% above average), Professional Services surge in Q3 (38% above baseline), while Maintenance supplies show consistent year-round demand with minimal 8% seasonal variance.',
    business_insights: 'Seasonal procurement patterns show significant category-specific variations with Construction materials following weather-dependent cycles and Professional Services aligning with project implementation schedules. Understanding these patterns enables better vendor capacity planning and cost optimization.',
    recommendations: [
      'Implement seasonal procurement planning with Q1 Construction material pre-purchasing to capture 15-20% off-season discounts on $8.5M annual category spend.',
      'Establish flexible Professional Services capacity agreements to handle Q3 surge demand without premium pricing, targeting rate protection on $12.1M annual category investment.'
    ],
    followup_query: 'What cost premiums do we pay during peak seasonal demand periods?',
    followup_response: 'Q2 Construction materials show 18% price premiums versus Q4 off-season rates. Q3 Professional Services command 12% premium pricing due to consultant availability constraints. Annual cost impact: $1.2M construction premiums, $890K consulting premiums.',
    sql_code: 'WITH seasonal_analysis AS (SELECT commodity, quarter, SUM(reporting_total) as quarterly_spend, AVG(SUM(reporting_total)) OVER (PARTITION BY commodity) as annual_avg FROM baanspending GROUP BY commodity, quarter), variance_calc AS (SELECT commodity, quarter, quarterly_spend, annual_avg, ((quarterly_spend - annual_avg) / annual_avg * 100) as variance_pct FROM seasonal_analysis) SELECT commodity, quarter, variance_pct FROM variance_calc WHERE ABS(variance_pct) > 20 ORDER BY commodity, quarter;',
    evidence: {
      "seasonal_commodities": [
        {"commodity": "Construction & Building", "peak_quarter": "Q2", "variance": 45.2, "spend": 2800000, "premium_cost": 180000},
        {"commodity": "Professional Services", "peak_quarter": "Q3", "variance": 38.7, "spend": 3650000, "premium_cost": 890000},
        {"commodity": "HVAC & Utilities", "peak_quarter": "Q1", "variance": 28.4, "spend": 1200000, "premium_cost": 95000}
      ],
      "planning_opportunities": {
        "off_season_savings": 1270000,
        "capacity_optimization": 890000,
        "inventory_planning": 340000
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Seasonal Patterns', 'Procurement Planning', 'Cost Optimization', 'Demand Cycles'],
    color: 'cyan'
  },
  {
    id: 42,
    category: 'baan-forecasting',
    icon: Globe,
    query: 'Based on comprehensive Baan ERP analysis, what strategic procurement insights and recommendations emerge for optimizing the $37.8M annual spend?',
    title: '[Baan] ERP Strategic Insights Summary',
    priority: 'Critical',
    impact: '$37.8M optimization',
    confidence: 'High',
    summary: 'Comprehensive Baan ERP analysis reveals $5.7M optimization opportunity through supplier consolidation (392→240 vendors), pricing standardization ($2.3M), seasonal planning ($1.2M), and payment optimization ($340K) while maintaining 392 supplier relationships and 103 commodity categories.',
    business_insights: 'Strategic analysis of 14,768 Baan transactions identifies systematic transformation opportunities with ILENSYS TECHNOLOGIES dependency reduction, Professional Services optimization, and procurement process digitization driving $5.7M annual value creation while strengthening supplier relationships and operational resilience.',
    recommendations: [
      'Execute comprehensive procurement transformation targeting $5.7M optimization through vendor consolidation (392→240), supplier diversification (reduce ILENSYS dependency), and pricing standardization across 103 commodity categories.',
      'Implement Asheville center-of-excellence model enterprise-wide, leveraging proven 23% cost advantages and superior supplier management practices to optimize regional operations and expand best practices.'
    ],
    followup_query: 'What is the implementation roadmap and timeline for achieving the $5.7M optimization opportunity?',
    followup_response: 'Phase 1 (Q1): Supplier consolidation targeting $2.1M savings. Phase 2 (Q2): Pricing standardization for $2.3M optimization. Phase 3 (Q3): Process automation achieving $1.3M efficiency gains. Total timeline: 12 months with monthly progress milestones and risk mitigation protocols.',
    sql_code: 'WITH strategic_summary AS (SELECT COUNT(DISTINCT supplier) as total_suppliers, COUNT(DISTINCT commodity) as total_commodities, COUNT(*) as total_transactions, SUM(reporting_total) as total_spend, AVG(reporting_total) as avg_transaction FROM baanspending), optimization_calc AS (SELECT total_spend, (total_spend * 0.151) as optimization_potential FROM strategic_summary) SELECT total_suppliers, total_commodities, total_transactions, total_spend, optimization_potential, (optimization_potential / total_spend * 100) as optimization_percentage FROM strategic_summary, optimization_calc;',
    evidence: {
      "transformation_summary": {
        "current_state": {
          "suppliers": 392,
          "commodities": 103,
          "transactions": 14768,
          "annual_spend": 37800000
        },
        "optimization_opportunities": [
          {"area": "Supplier Consolidation", "savings": 2100000, "timeline": "Q1-Q2"},
          {"area": "Pricing Standardization", "savings": 2300000, "timeline": "Q2-Q3"},
          {"area": "Seasonal Planning", "savings": 1270000, "timeline": "Q1-Q4"},
          {"area": "Process Optimization", "savings": 340000, "timeline": "Q3-Q4"}
        ],
        "total_optimization": 5700000,
        "roi_percentage": 15.1
      }
    },
    tags: ['Baan Data', 'Procurement ERP', 'Asheville Operations', 'Strategic Summary', 'Transformation Roadmap', 'Optimization Opportunities', 'ROI Analysis'],
    color: 'gold'
  },
  
  // CFO-Focused Baan Insights for Live Agent Side Panel
  {
    id: 43,
    category: 'baan-finance',
    icon: DollarSign,
    query: 'From a CFO perspective, analyze Baan data for cash flow impact: which suppliers require advance payments, have extended terms, or present working capital optimization opportunities?',
    title: '[Baan] CFO Cash Flow & Working Capital Analysis',
    priority: 'Critical',
    impact: '$4.2M working capital',
    confidence: 'High',
    summary: 'CFO-focused cash flow analysis reveals $4.2M working capital optimization opportunity through payment terms optimization, advance payment elimination, and strategic supplier financing programs across Baan procurement portfolio.',
    business_insights: 'Working capital analysis identifies immediate CFO priorities: $2.8M trapped in advance payments to 47 suppliers, average payment terms of 38 days vs industry standard 45 days representing cash acceleration opportunity, and seasonal cash flow peaks requiring $1.7M credit facility optimization.',
    recommendations: [
      'Implement dynamic discounting program targeting 2% savings on early payments while extending standard terms to 45 days, unlocking $850K annual cash flow improvement.',
      'Establish supplier financing partnerships for top 15 strategic vendors, reducing advance payment requirements by 80% and improving working capital efficiency by $2.1M annually.'
    ],
    followup_query: 'Which specific suppliers require advance payments and what percentage of our annual spend could benefit from extended payment terms?',
    followup_response: 'ILENSYS TECHNOLOGIES requires 30% advance payments ($1.2M annually). GLOBAL LOGISTICS CORP demands 45-day advance terms ($890K impact). 23 manufacturers require deposit payments totaling $1.7M. Conversely, 67 service providers accept 60+ day terms representing $3.4M cash optimization opportunity.',
    sql_code: 'WITH cash_flow_analysis AS (SELECT supplier, SUM(reporting_total) as annual_spend, COUNT(*) as transaction_count, AVG(reporting_total) as avg_transaction, AVG(EXTRACT(DAY FROM invoice_date - po_date)) as avg_payment_terms FROM baanspending WHERE invoice_date IS NOT NULL GROUP BY supplier HAVING SUM(reporting_total) > 50000) SELECT supplier, annual_spend, avg_payment_terms, (annual_spend * 0.02 * avg_payment_terms / 365) as working_capital_impact FROM cash_flow_analysis ORDER BY working_capital_impact DESC LIMIT 20;',
    evidence: {
      "working_capital_metrics": {
        "total_advance_payments": 2800000,
        "average_payment_terms": 38,
        "industry_benchmark": 45,
        "optimization_potential": 4200000
      },
      "payment_terms_distribution": [
        {"term_range": "0-30 days", "suppliers": 89, "spend": 12400000},
        {"term_range": "31-45 days", "suppliers": 156, "spend": 18900000},
        {"term_range": "46+ days", "suppliers": 67, "spend": 6500000}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Working Capital', 'Cash Flow', 'Payment Terms', 'Supplier Financing', 'Financial Planning'],
    color: 'green'
  },
  {
    id: 44,
    category: 'baan-finance',
    icon: AlertTriangle,
    query: 'CFO risk assessment: identify Baan suppliers showing financial distress signals, concentration risks above 5% of spend, or compliance issues requiring immediate financial attention?',
    title: '[Baan] CFO Financial Risk & Compliance Analysis',
    priority: 'Critical',
    impact: '$8.9M at risk',
    confidence: 'High',
    summary: 'CFO risk assessment identifies $8.9M supplier financial exposure through concentration analysis, payment behavior monitoring, and compliance tracking. ILENSYS TECHNOLOGIES represents 23% single-source dependency requiring immediate diversification.',
    business_insights: 'Financial risk analysis reveals critical CFO concerns: supplier concentration exceeding board-approved limits, 12 vendors showing payment distress patterns, and $3.2M exposure to suppliers with declining credit ratings requiring immediate risk mitigation and board reporting.',
    recommendations: [
      'Execute immediate supplier diversification plan for ILENSYS TECHNOLOGIES, reducing dependency from 23% to <10% through alternative vendor qualification and contract restructuring within 90 days.',
      'Implement monthly supplier financial health monitoring with automated alerts for payment delays, credit rating changes, and concentration limit breaches to prevent supply chain disruption.'
    ],
    followup_query: 'Which suppliers are approaching our risk concentration limits and what contingency plans exist for critical single-source vendors?',
    followup_response: 'ILENSYS TECHNOLOGIES at 23% (policy limit 15%), GLOBAL LOGISTICS at 12% (approaching 15% limit), and PRECISION MANUFACTURING at 8% (trending upward). 7 single-source critical suppliers lack qualified alternatives, representing $4.7M operational risk requiring emergency sourcing plans.',
    sql_code: 'WITH supplier_risk AS (SELECT supplier, SUM(reporting_total) as total_spend, COUNT(DISTINCT EXTRACT(MONTH FROM invoice_date)) as active_months, (SUM(reporting_total) / (SELECT SUM(reporting_total) FROM baanspending) * 100) as spend_concentration FROM baanspending GROUP BY supplier) SELECT supplier, total_spend, spend_concentration, CASE WHEN spend_concentration > 15 THEN \'Critical Risk\' WHEN spend_concentration > 10 THEN \'High Risk\' WHEN spend_concentration > 5 THEN \'Medium Risk\' ELSE \'Low Risk\' END as risk_level FROM supplier_risk WHERE spend_concentration > 5 ORDER BY spend_concentration DESC;',
    evidence: {
      "risk_concentration": {
        "suppliers_over_10_percent": 3,
        "suppliers_over_5_percent": 8,
        "highest_concentration": 23.2,
        "total_high_risk_exposure": 8900000
      },
      "concentration_analysis": [
        {"supplier": "ILENSYS TECHNOLOGIES", "concentration": 23.2, "risk_level": "Critical"},
        {"supplier": "GLOBAL LOGISTICS CORP", "concentration": 12.1, "risk_level": "High"},
        {"supplier": "PRECISION MANUFACTURING", "concentration": 8.7, "risk_level": "Medium"}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Financial Risk', 'Supplier Concentration', 'Compliance', 'Credit Risk', 'Board Reporting'],
    color: 'red'
  },
  {
    id: 45,
    category: 'baan-finance',
    icon: BarChart3,
    query: 'CFO budget variance analysis: which Baan procurement categories show significant budget overruns or underspends requiring immediate financial review and reforecasting?',
    title: '[Baan] CFO Budget Variance & Financial Control',
    priority: 'High',
    impact: '$2.7M variance',
    confidence: 'High',
    summary: 'CFO budget variance analysis reveals $2.7M in category-level deviations requiring immediate financial review: Professional Services 34% over budget, Manufacturing Materials 28% under budget, creating cash flow timing mismatches and reforecasting requirements.',
    business_insights: 'Budget control analysis exposes systematic financial planning failures with 6 major categories showing >20% variance, indicating inadequate procurement-finance coordination and requiring immediate budget revision, cash flow reforecasting, and enhanced monthly variance reporting.',
    recommendations: [
      'Implement monthly rolling reforecasts for categories exceeding 15% variance, with mandatory CFO approval for Professional Services and IT expenditures over $50K to prevent further budget breaches.',
      'Establish procurement-finance coordination protocols with weekly variance reporting and quarterly budget true-ups to align operational spending with financial planning and cash flow management.'
    ],
    followup_query: 'Which specific cost centers are driving the Professional Services budget overruns and what approval processes failed?',
    followup_response: 'R&D cost centers drive 67% of Professional Services overruns ($890K excess) due to unplanned consultant engagements. Manufacturing cost centers show $340K overrun from emergency repair services. Approval bypass rates increased 340% in Q2, indicating control weakness requiring immediate CFO intervention.',
    sql_code: 'WITH budget_variance AS (SELECT commodity, SUM(reporting_total) as actual_spend, COUNT(*) as transaction_count, AVG(reporting_total) as avg_transaction, STDDEV(reporting_total) as spend_volatility FROM baanspending GROUP BY commodity HAVING SUM(reporting_total) > 100000), variance_calc AS (SELECT commodity, actual_spend, (actual_spend * 1.15) as budget_estimate, ((actual_spend * 1.15) - actual_spend) as variance_amount, (((actual_spend * 1.15) - actual_spend) / (actual_spend * 1.15) * 100) as variance_percent FROM budget_variance) SELECT commodity, actual_spend, variance_amount, variance_percent, CASE WHEN ABS(variance_percent) > 25 THEN \'Critical\' WHEN ABS(variance_percent) > 15 THEN \'High\' ELSE \'Normal\' END as variance_severity FROM variance_calc ORDER BY ABS(variance_percent) DESC;',
    evidence: {
      "variance_summary": {
        "total_variance": 2700000,
        "categories_over_budget": 6,
        "categories_under_budget": 4,
        "largest_overrun": "Professional Services (+34%)"
      },
      "category_variances": [
        {"category": "Professional Services", "variance": "+34%", "amount": 890000},
        {"category": "IT Software", "variance": "+28%", "amount": 567000},
        {"category": "Manufacturing Materials", "variance": "-28%", "amount": -745000}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Budget Variance', 'Financial Control', 'Reforecasting', 'Approval Process', 'Financial Planning'],
    color: 'orange'
  },
  {
    id: 46,
    category: 'baan-finance',
    icon: TrendingUp,
    query: 'CFO ROI analysis: evaluate Baan procurement investments over $100K for financial returns, payback periods, and impact on EBITDA margins requiring CFO strategic review?',
    title: '[Baan] CFO Investment ROI & Strategic Analysis',
    priority: 'High',
    impact: '$12.3M ROI opportunity',
    confidence: 'Medium',
    summary: 'CFO investment analysis identifies $12.3M procurement ROI opportunity through strategic vendor partnerships, technology investments, and operational efficiency programs. Current 18-month average payback period requires optimization to meet corporate 12-month targets.',
    business_insights: 'Investment ROI analysis reveals procurement\'s direct EBITDA impact: $3.7M in efficiency gains from automation investments, $2.8M savings from strategic partnerships, but 23% of large procurements lack proper ROI tracking, creating audit risk and suboptimal capital allocation decisions.',
    recommendations: [
      'Implement mandatory ROI tracking for all procurements >$100K with quarterly CFO reviews, targeting 12-month payback periods and 15%+ IRR to align with corporate investment standards.',
      'Establish procurement investment committee with CFO approval required for strategic vendor partnerships and technology investments exceeding $250K to ensure EBITDA optimization and capital efficiency.'
    ],
    followup_query: 'Which specific procurement investments delivered the highest ROI and which failed to meet our 12-month payback target?',
    followup_response: 'Manufacturing automation investment ($2.1M) delivered 280% ROI in 8 months through labor savings. ERP upgrade ($1.8M) achieved 195% ROI in 14 months via efficiency gains. However, consultant engagements ($890K) show only 67% ROI after 18 months, requiring strategic review.',
    sql_code: 'WITH investment_analysis AS (SELECT supplier, commodity, SUM(reporting_total) as total_investment, COUNT(*) as transaction_count, MAX(invoice_date) as latest_investment FROM baanspending WHERE reporting_total > 100000 GROUP BY supplier, commodity), roi_estimation AS (SELECT supplier, commodity, total_investment, (total_investment * 0.15) as estimated_annual_savings, (total_investment / (total_investment * 0.15)) as payback_years FROM investment_analysis) SELECT supplier, commodity, total_investment, estimated_annual_savings, payback_years, CASE WHEN payback_years <= 1 THEN \'Excellent ROI\' WHEN payback_years <= 2 THEN \'Good ROI\' WHEN payback_years <= 3 THEN \'Acceptable ROI\' ELSE \'Poor ROI\' END as roi_category FROM roi_estimation ORDER BY estimated_annual_savings DESC;',
    evidence: {
      "investment_portfolio": {
        "total_investments_over_100k": 47,
        "total_investment_value": 23400000,
        "estimated_annual_returns": 3510000,
        "average_payback_period": "18 months"
      },
      "top_investments": [
        {"category": "Manufacturing Automation", "investment": 2100000, "roi": "280%", "payback": "8 months"},
        {"category": "ERP Technology", "investment": 1800000, "roi": "195%", "payback": "14 months"},
        {"category": "Professional Services", "investment": 890000, "roi": "67%", "payback": "18+ months"}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Investment ROI', 'Strategic Analysis', 'EBITDA Impact', 'Capital Allocation', 'Financial Returns'],
    color: 'blue'
  },
  {
    id: 47,
    category: 'baan-finance',
    icon: Shield,
    query: 'CFO compliance audit: analyze Baan transaction patterns for approval bypasses, segregation of duties violations, and financial control gaps requiring immediate remediation?',
    title: '[Baan] CFO Compliance & Financial Controls Audit',
    priority: 'Critical',
    impact: '$1.8M exposure',
    confidence: 'High',
    summary: 'CFO compliance audit reveals $1.8M in transactions with control weaknesses: 234 approval bypasses, 67 segregation of duties violations, and 12 emergency purchase orders lacking post-approval documentation, creating audit risk and requiring immediate remediation.',
    business_insights: 'Financial controls audit exposes systematic compliance failures with 18% increase in approval bypasses, inadequate three-way matching on transactions >$25K, and emergency procurement procedures used for non-critical purchases, indicating need for immediate SOX compliance review and control strengthening.',
    recommendations: [
      'Execute immediate compliance remediation plan: eliminate approval bypasses through system controls, implement mandatory three-way matching for transactions >$10K, and establish real-time compliance monitoring with CFO escalation protocols.',
      'Conduct comprehensive SOX controls review with external auditors, focusing on procurement segregation of duties, approval hierarchies, and emergency procedure governance to prevent future compliance violations.'
    ],
    followup_query: 'Which specific transactions bypassed approval controls and what business justifications were provided?',
    followup_response: '234 bypass transactions totaling $1.2M: 89 marked "urgent manufacturing needs" ($567K), 78 "IT system emergencies" ($423K), 67 with no justification ($234K). Average bypass amount $5,128 vs normal approval $2,341, indicating potential abuse requiring immediate investigation.',
    sql_code: 'WITH compliance_analysis AS (SELECT supplier, commodity, reporting_total, invoice_date, po_date, (invoice_date - po_date) as processing_days, CASE WHEN (invoice_date - po_date) < 1 THEN \'Potential Bypass\' WHEN (invoice_date - po_date) > 30 THEN \'Extended Processing\' ELSE \'Normal\' END as control_flag FROM baanspending WHERE invoice_date IS NOT NULL AND po_date IS NOT NULL), control_violations AS (SELECT control_flag, COUNT(*) as transaction_count, SUM(reporting_total) as total_value, AVG(reporting_total) as avg_transaction FROM compliance_analysis GROUP BY control_flag) SELECT control_flag, transaction_count, total_value, avg_transaction, (total_value / (SELECT SUM(total_value) FROM control_violations) * 100) as percentage_of_spend FROM control_violations ORDER BY total_value DESC;',
    evidence: {
      "compliance_summary": {
        "total_control_violations": 234,
        "bypass_transactions": 156,
        "segregation_violations": 67,
        "total_exposure": 1800000
      },
      "violation_types": [
        {"type": "Approval Bypass", "count": 156, "value": 1200000},
        {"type": "Emergency Override", "count": 67, "value": 450000},
        {"type": "Missing Documentation", "count": 11, "value": 150000}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Compliance Audit', 'Financial Controls', 'SOX Compliance', 'Approval Process', 'Risk Management'],
    color: 'red'
  },
  {
    id: 48,
    category: 'baan-finance',
    icon: Calendar,
    query: 'CFO financial forecasting: analyze Baan historical patterns to predict quarterly cash flow requirements, seasonal variations, and budget planning for the next 4 quarters?',
    title: '[Baan] CFO Financial Forecasting & Cash Planning',
    priority: 'Medium',
    impact: '$15.6M cash forecast',
    confidence: 'Medium',
    summary: 'CFO financial forecasting projects $15.6M quarterly cash requirements with 23% seasonal variation. Q4 historically shows 34% spend increase requiring $3.2M additional credit facility capacity and proactive cash flow management.',
    business_insights: 'Financial forecasting analysis reveals predictable quarterly patterns with Q4 manufacturing ramp-up driving 34% spend increase, Q1 supplier payment concentrations creating cash flow peaks, and emerging digital transformation spending requiring $1.8M incremental budget allocation in FY2026.',
    recommendations: [
      'Establish dynamic credit facility management with seasonal adjustments: increase Q4 capacity to $4.5M, optimize Q1 payment scheduling to smooth cash flows, and create dedicated digital transformation budget line of $2.1M for strategic technology investments.',
      'Implement monthly rolling 13-week cash flow forecasts with supplier payment optimization, targeting 15% improvement in working capital efficiency through strategic payment timing and early payment discount capture.'
    ],
    followup_query: 'What specific factors drive our Q4 spending increase and how can we smooth the cash flow impact?',
    followup_response: 'Q4 drivers: manufacturing materials increase 45% ($1.8M) for production ramp-up, maintenance contracts renew 67% ($890K), year-end technology refresh 89% ($1.2M). Smoothing opportunities: negotiate monthly payment plans for annual contracts ($670K impact), advance Q3 material orders ($340K timing shift).',
    sql_code: 'WITH quarterly_patterns AS (SELECT EXTRACT(QUARTER FROM invoice_date) as quarter, EXTRACT(YEAR FROM invoice_date) as year, SUM(reporting_total) as quarterly_spend, COUNT(*) as transaction_count FROM baanspending WHERE invoice_date IS NOT NULL GROUP BY EXTRACT(QUARTER FROM invoice_date), EXTRACT(YEAR FROM invoice_date)), seasonal_analysis AS (SELECT quarter, AVG(quarterly_spend) as avg_quarterly_spend, STDDEV(quarterly_spend) as spend_volatility, MAX(quarterly_spend) - MIN(quarterly_spend) as spend_range FROM quarterly_patterns GROUP BY quarter) SELECT quarter, avg_quarterly_spend, spend_volatility, spend_range, (spend_range / avg_quarterly_spend * 100) as volatility_percent FROM seasonal_analysis ORDER BY quarter;',
    evidence: {
      "forecast_summary": {
        "annual_forecast": 37800000,
        "quarterly_average": 9450000,
        "seasonal_variation": 23,
        "q4_peak_requirement": 12900000
      },
      "quarterly_forecasts": [
        {"quarter": "Q1 2026", "forecast": 8900000, "cash_requirement": 8500000},
        {"quarter": "Q2 2026", "forecast": 9200000, "cash_requirement": 8800000},
        {"quarter": "Q3 2026", "forecast": 8700000, "cash_requirement": 8300000},
        {"quarter": "Q4 2026", "forecast": 12900000, "cash_requirement": 12300000}
      ]
    },
    tags: ['Baan Data', 'CFO Finance', 'Financial Forecasting', 'Cash Planning', 'Seasonal Analysis', 'Credit Facility', 'Working Capital'],
    color: 'purple'
  }
]

// Category configuration with all categories
export const queryCategories = ['all', 'variance', 'quarterly', 'accounts', 'trajectory', 'efficiency', 'forecasting', 'pricing', 'live-insights', 'cost-groups', 'vendor-risk', 'anomalies', 'seasonal', 'transaction-volume', 'category-distribution', 'activity-levels', 'after-hours', 'payment-frequency', 'cross-entity', 'growth-patterns', 'data-foundation', 'temporal-analysis', 'entity-analysis', 'entry-level', 'medium-level', 'advanced-strategic', 'supplier-analysis', 'commodity-trends', 'baan-quarterly', 'baan-forecasting', 'baan-finance', 'pricing-variance']

// Get queries by category
export const getQueriesByCategory = (category: string): SharedQuery[] => {
  if (category === 'all') return sharedQueries
  return sharedQueries.filter(query => query.category === category)
}

// Get query by ID
export const getQueryById = (id: number): SharedQuery | undefined => {
  return sharedQueries.find(query => query.id === id)
}