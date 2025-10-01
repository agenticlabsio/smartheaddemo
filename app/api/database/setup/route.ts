import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import CSVParser from '@/lib/csv-parser';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { action, csvPath, dataType = 'coupa' } = await request.json();

    if (action === 'setup') {
      // Setup database schema and pgvector
      console.log('Setting up database...');
      const setupResult = await Database.setupDatabase();
      
      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully',
        result: setupResult
      });
    }

    if (action === 'import' && csvPath) {
      console.log(`Starting CSV import for ${dataType} data...`);
      
      // Parse CSV file
      const csvFilePath = path.join(process.cwd(), csvPath);
      if (!fs.existsSync(csvFilePath)) {
        return NextResponse.json({
          success: false,
          error: 'CSV file not found'
        }, { status: 404 });
      }

      // Use appropriate parser based on data type
      let records, summary, importedCount;
      
      if (dataType === 'coupa') {
        // Use existing financial data parser for Coupa data
        records = await CSVParser.parseCSVFile(csvFilePath);
        console.log(`Parsed ${records.length} Coupa records from CSV`);
        summary = CSVParser.getDataSummary(records);
        importedCount = await Database.importCSVData(records);
      } else if (dataType === 'baan') {
        // Use generic parser for Baan data
        records = await CSVParser.parseGenericCSVFile(csvFilePath);
        console.log(`Parsed ${records.length} Baan records from CSV`);
        summary = CSVParser.getGenericDataSummary(records, dataType);
        importedCount = await Database.importBaanCSVData(records);
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid data type. Supported types: coupa, baan'
        }, { status: 400 });
      }

      console.log('CSV Data Summary:', summary);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} ${dataType} records`,
        summary: summary,
        importedCount: importedCount,
        dataType: dataType
      });
    }

    if (action === 'status') {
      // Check database status
      const client = await Database.getClient();
      try {
        const tableName = dataType === 'baan' ? 'baanspending' : 'financial_data';
        
        // Check if table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [tableName]);
        
        const tableExists = tableCheck.rows[0].exists;
        
        if (!tableExists) {
          return NextResponse.json({
            success: true,
            recordCount: 0,
            sampleData: [],
            message: `${tableName} table does not exist yet`,
            dataType: dataType
          });
        }
        
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        
        const sampleQuery = await client.query(`SELECT * FROM ${tableName} LIMIT 5`);
        
        return NextResponse.json({
          success: true,
          recordCount: count,
          sampleData: sampleQuery.rows,
          message: `Database contains ${count} ${dataType} records`,
          dataType: dataType
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action specified'
    }, { status: 400 });

  } catch (error) {
    console.error('Database setup/import error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get current database status
    const client = await Database.getClient();
    try {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'financial_data'
        );
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      
      if (!tableExists) {
        return NextResponse.json({
          success: true,
          status: 'not_setup',
          message: 'Database not yet setup'
        });
      }

      // Get record count
      const countResult = await client.query('SELECT COUNT(*) FROM financial_data');
      const recordCount = parseInt(countResult.rows[0].count);

      // Get sample data
      const sampleResult = await client.query(`
        SELECT 
          hfm_entity, hfm_cost_group, account, amount, fiscal_year_number
        FROM financial_data 
        ORDER BY id 
        LIMIT 5
      `);

      return NextResponse.json({
        success: true,
        status: 'ready',
        recordCount: recordCount,
        sampleData: sampleResult.rows,
        message: `Database ready with ${recordCount} records`
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database status check error:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}