import { NextRequest, NextResponse } from 'next/server'
import { unifiedStorage } from '@/lib/storage/unified-storage'
import { Database } from '@/lib/database'
import { auth } from '@clerk/nextjs/server'

interface EvidenceData {
  columns: { name: string; type: string }[];
  rows: Record<string, any>[];
  totalRows: number;
  sqlQuery: string;
  chartable: boolean;
  metadata: {
    executionTime: number;
    source: string;
    queryType: string;
  };
}

// Detect if data is suitable for charting
function isChartable(columns: string[], rows: any[]): boolean {
  if (!rows || rows.length === 0) return false;
  
  // Look for numerical columns
  const numericalColumns = columns.filter(col => {
    const sample = rows[0]?.[col];
    return typeof sample === 'number' || 
           (typeof sample === 'string' && !isNaN(parseFloat(sample)));
  });
  
  // Look for categorical columns
  const categoricalColumns = columns.filter(col => {
    const sample = rows[0]?.[col];
    return typeof sample === 'string' && isNaN(parseFloat(sample));
  });
  
  // Needs at least one numerical and one categorical column for basic charts
  return numericalColumns.length >= 1 && categoricalColumns.length >= 1;
}

// Extract column metadata
function getColumnMetadata(rows: any[]): { name: string; type: string }[] {
  if (!rows || rows.length === 0) return [];
  
  const sample = rows[0];
  return Object.keys(sample).map(key => {
    const value = sample[key];
    let type = 'string';
    
    if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'string') {
      if (!isNaN(parseFloat(value))) {
        type = 'number';
      } else if (value.includes('-') && value.length === 10) {
        type = 'date';
      }
    }
    
    return { name: key, type };
  });
}

// Determine query type from SQL
function detectQueryType(sql: string): string {
  const lowerSql = sql.toLowerCase();
  
  if (lowerSql.includes('supplier') && lowerSql.includes('sum')) return 'supplier_analysis';
  if (lowerSql.includes('commodity') && lowerSql.includes('group by')) return 'category_analysis';
  if (lowerSql.includes('month') || lowerSql.includes('quarter')) return 'temporal_analysis';
  if (lowerSql.includes('count') && lowerSql.includes('supplier')) return 'frequency_analysis';
  if (lowerSql.includes('risk') || lowerSql.includes('concentration')) return 'risk_analysis';
  
  return 'general_query';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const messageId = id
    
    // Try to get SQL query from unified storage
    let sqlQuery = await unifiedStorage.getMessageSQLQuery(messageId, userId)
    
    // If not found, provide Baan-specific fallback query
    if (!sqlQuery) {
      console.log(`No SQL query found for messageId: ${messageId}`)
      sqlQuery = `SELECT 
                    supplier,
                    commodity,
                    COUNT(*) as transaction_count,
                    SUM(reporting_total) as total_spend,
                    ROUND(AVG(reporting_total), 2) as avg_transaction_size
                  FROM baanspending 
                  WHERE year = 2025 AND month <= 6
                    AND reporting_total > 0
                  GROUP BY supplier, commodity 
                  HAVING SUM(reporting_total) > 1000
                  ORDER BY total_spend DESC 
                  LIMIT 20`
    }

    // Execute the SQL query with timeout
    const client = await Database.getClient()
    let results = []
    
    try {
      // Set query timeout to 10 seconds
      await client.query('SET statement_timeout = 10000')
      const queryResult = await client.query(sqlQuery)
      results = queryResult.rows
    } catch (error) {
      console.error('Database query error:', error)
      
      // If query fails, try a safe fallback
      if (sqlQuery.includes('baanspending')) {
        console.log('Falling back to simple Baan query...')
        const fallbackQuery = `SELECT supplier, SUM(reporting_total) as total_spend 
                              FROM baanspending 
                              WHERE year = 2025 AND month <= 6 
                              GROUP BY supplier 
                              ORDER BY total_spend DESC 
                              LIMIT 10`
        const fallbackResult = await client.query(fallbackQuery)
        results = fallbackResult.rows
        sqlQuery = fallbackQuery
      } else {
        throw error
      }
    } finally {
      client.release()
    }
    
    const executionTime = Date.now() - startTime;
    
    // Limit results for performance
    const limitedResults = results.slice(0, 1000);
    
    // Get column metadata
    const columns = getColumnMetadata(limitedResults);
    const columnNames = columns.map(col => col.name);
    
    // Check if data is chartable
    const chartable = isChartable(columnNames, limitedResults);
    
    // Detect query type
    const queryType = detectQueryType(sqlQuery);
    
    const evidenceData: EvidenceData = {
      columns,
      rows: limitedResults,
      totalRows: results.length,
      sqlQuery,
      chartable,
      metadata: {
        executionTime,
        source: sqlQuery.includes('baanspending') ? 'baan' : 'unknown',
        queryType
      }
    }

    return NextResponse.json(evidenceData)
  } catch (error) {
    console.error('Evidence data error:', error)
    return NextResponse.json(
      { 
        error: "Failed to retrieve evidence data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}