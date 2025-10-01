import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import EmbeddingService from '@/lib/embedding-service';

export async function POST(request: NextRequest) {
  try {
    const { provider = 'google', batchSize = 50, startId = 0 } = await request.json();

    // Initialize embedding service
    const embeddingService = new EmbeddingService({
      provider: provider as 'google' | 'openai',
      batchSize,
      maxRetries: 3
    });

    // Test embedding service first
    console.log('Testing embedding service...');
    const testResult = await embeddingService.testEmbedding();
    
    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Embedding service test failed',
        details: testResult
      }, { status: 500 });
    }

    console.log(`Embedding service ready: ${testResult.provider} (${testResult.dimensions} dimensions)`);

    // Get records that need embeddings
    const client = await Database.getClient();
    
    try {
      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM financial_data 
        WHERE id >= $1 AND combined_text_embedding IS NULL
      `;
      const countResult = await client.query(countQuery, [startId]);
      const totalRecords = parseInt(countResult.rows[0].count);

      if (totalRecords === 0) {
        return NextResponse.json({
          success: true,
          message: 'All records already have embeddings',
          processedCount: 0,
          totalRecords: 0
        });
      }

      console.log(`Found ${totalRecords} records needing embeddings (starting from ID ${startId})`);

      // Get records in batches
      const selectQuery = `
        SELECT id, hfm_entity, hfm_cost_group, account, cost_center
        FROM financial_data 
        WHERE id >= $1 AND combined_text_embedding IS NULL
        ORDER BY id
        LIMIT $2
      `;

      const records = await client.query(selectQuery, [startId, batchSize * 5]); // Get multiple batches worth
      
      if (records.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No more records to process',
          processedCount: 0,
          totalRecords: totalRecords
        });
      }

      console.log(`Processing ${records.rows.length} records...`);

      // Prepare text data for embedding
      const textsToEmbed = records.rows.map(record => 
        EmbeddingService.combineTextFields(record)
      );

      // Generate embeddings
      console.log('Generating embeddings...');
      const embeddings = await embeddingService.generateBatchEmbeddings(textsToEmbed);

      // Update database with embeddings
      console.log('Updating database with embeddings...');
      const updateQuery = `
        UPDATE financial_data 
        SET 
          combined_text_embedding = $2::vector,
          updated_at = NOW()
        WHERE id = $1
      `;

      let processedCount = 0;
      
      await client.query('BEGIN');
      
      for (let i = 0; i < records.rows.length; i++) {
        try {
          const recordId = records.rows[i].id;
          const embedding = embeddings[i];
          
          // Skip if embedding generation failed (zeros array)
          if (embedding.every(val => val === 0)) {
            console.warn(`Skipping record ${recordId} due to failed embedding`);
            continue;
          }

          await client.query(updateQuery, [recordId, JSON.stringify(embedding)]);
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`Updated ${processedCount}/${records.rows.length} records...`);
          }
        } catch (updateError) {
          console.error(`Failed to update record ${records.rows[i].id}:`, updateError);
        }
      }
      
      await client.query('COMMIT');

      // Get updated statistics
      const remainingQuery = `
        SELECT COUNT(*) 
        FROM financial_data 
        WHERE combined_text_embedding IS NULL
      `;
      const remainingResult = await client.query(remainingQuery);
      const remainingRecords = parseInt(remainingResult.rows[0].count);

      const completedQuery = `
        SELECT COUNT(*) 
        FROM financial_data 
        WHERE combined_text_embedding IS NOT NULL
      `;
      const completedResult = await client.query(completedQuery);
      const completedRecords = parseInt(completedResult.rows[0].count);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${processedCount} records`,
        processedCount,
        totalRecords,
        remainingRecords,
        completedRecords,
        nextStartId: records.rows.length > 0 ? records.rows[records.rows.length - 1].id + 1 : null,
        embeddingDimensions: testResult.dimensions,
        provider: testResult.provider
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Embedding generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get embedding statistics
    const client = await Database.getClient();
    
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(combined_text_embedding) as records_with_embeddings,
          COUNT(*) - COUNT(combined_text_embedding) as records_without_embeddings
        FROM financial_data
      `;
      
      const result = await client.query(statsQuery);
      const stats = result.rows[0];

      // Get sample embedded records
      const sampleQuery = `
        SELECT id, hfm_entity, hfm_cost_group, account, amount
        FROM financial_data 
        WHERE combined_text_embedding IS NOT NULL
        ORDER BY id
        LIMIT 5
      `;
      
      const sampleResult = await client.query(sampleQuery);

      return NextResponse.json({
        success: true,
        statistics: {
          totalRecords: parseInt(stats.total_records),
          recordsWithEmbeddings: parseInt(stats.records_with_embeddings),
          recordsWithoutEmbeddings: parseInt(stats.records_without_embeddings),
          completionPercentage: Math.round((parseInt(stats.records_with_embeddings) / parseInt(stats.total_records)) * 100)
        },
        sampleRecords: sampleResult.rows
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Embedding statistics error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}