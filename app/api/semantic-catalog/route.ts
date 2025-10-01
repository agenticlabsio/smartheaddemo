import { NextRequest, NextResponse } from 'next/server';
import SemanticCatalog from '@/lib/semantic-catalog';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    const semanticCatalog = new SemanticCatalog({
      catalogName: 'procurement_analytics',
      embeddingModel: 'text-embedding-3-small'
    });

    switch (action) {
      case 'create':
        await semanticCatalog.createCatalog();
        return NextResponse.json({
          success: true,
          message: 'Semantic catalog created successfully'
        });

      case 'populate':
        await semanticCatalog.populateCatalog();
        return NextResponse.json({
          success: true,
          message: 'Semantic catalog populated with procurement schema and facts'
        });

      case 'setup':
        await semanticCatalog.createCatalog();
        await semanticCatalog.populateCatalog();
        return NextResponse.json({
          success: true,
          message: 'Semantic catalog fully initialized with procurement analytics schema'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: create, populate, or setup'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Semantic catalog API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({
        success: true,
        status: 'Semantic catalog API ready',
        endpoints: {
          'POST /': 'Create, populate, or setup semantic catalog',
          'GET /?q=query': 'Search semantic catalog'
        }
      });
    }

    const semanticCatalog = new SemanticCatalog({
      catalogName: 'procurement_analytics',
      embeddingModel: 'text-embedding-3-small'
    });

    const searchResults = await semanticCatalog.semanticSearch(query, 10);
    const context = await semanticCatalog.renderContextForLLM(query);

    return NextResponse.json({
      success: true,
      query,
      results: searchResults,
      context,
      total_objects: searchResults.objects.length,
      total_facts: searchResults.facts.length
    });
  } catch (error) {
    console.error('Semantic catalog search error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}