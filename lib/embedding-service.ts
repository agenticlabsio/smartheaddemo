import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface EmbeddingConfig {
  provider: 'google' | 'openai';
  model?: string;
  maxRetries?: number;
  batchSize?: number;
  dimensions?: number;
  useLatestModel?: boolean;
}

export class EmbeddingService {
  private googleAI?: GoogleGenerativeAI;
  private openai?: OpenAI;
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = {
      maxRetries: 3,
      batchSize: 100,
      dimensions: 768, // Default for EmbeddingGemma
      useLatestModel: true,
      model: config.provider === 'google' 
        ? (config.useLatestModel !== false ? 'text-embedding-004' : 'text-embedding-004') 
        : 'text-embedding-3-small',
      ...config
    };

    // Initialize Google AI
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (googleApiKey) {
      this.googleAI = new GoogleGenerativeAI(googleApiKey);
    }

    // Initialize OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey
      });
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    let lastError: Error | null = null;

    // Try primary provider
    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        if (this.config.provider === 'google' && this.googleAI) {
          return await this.generateGoogleEmbedding(text);
        } else if (this.config.provider === 'openai' && this.openai) {
          return await this.generateOpenAIEmbedding(text);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed with ${this.config.provider}:`, error);
        
        if (attempt < this.config.maxRetries!) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    // Try fallback provider
    try {
      if (this.config.provider === 'google' && this.openai) {
        console.log('Falling back to OpenAI...');
        return await this.generateOpenAIEmbedding(text);
      } else if (this.config.provider === 'openai' && this.googleAI) {
        console.log('Falling back to Google...');
        return await this.generateGoogleEmbedding(text);
      }
    } catch (fallbackError) {
      console.error('Fallback provider also failed:', fallbackError);
    }

    throw new Error(`Failed to generate embedding after ${this.config.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  private async generateGoogleEmbedding(text: string): Promise<number[]> {
    if (!this.googleAI) {
      throw new Error('Google AI not initialized. Check GOOGLE_API_KEY environment variable.');
    }

    try {
      // Use latest Google embedding model (text-embedding-004 for now, will upgrade to EmbeddingGemma when available in API)
      const model = this.googleAI.getGenerativeModel({ 
        model: this.config.model || 'text-embedding-004' 
      });
      
      // Format text for optimal embedding performance (inspired by EmbeddingGemma format)
      const formattedText = this.formatTextForEmbedding(text);
      const result = await model.embedContent(formattedText);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('Invalid embedding response from Google AI');
      }

      return result.embedding.values;
    } catch (error) {
      throw new Error(`Google embedding failed: ${error}`);
    }
  }

  // Format text for optimal embedding performance (based on EmbeddingGemma recommendations)
  private formatTextForEmbedding(text: string): string {
    // For supplier/financial data, we format as document-style embedding
    if (text.includes('|')) {
      // Already formatted, use as-is
      return `text: ${text}`;
    }
    
    // Format as document for semantic search
    return `title: Financial Data | text: ${text}`;
  }

  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Check OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model!,
        input: text,
        encoding_format: 'float',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Invalid embedding response from OpenAI');
      }

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`OpenAI embedding failed: ${error}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = this.config.batchSize!;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}...`);
      
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch embedding failed:', result.reason);
          // Push zeros for failed embeddings to maintain array alignment
          results.push(new Array(1536).fill(0));
        }
      }
      
      // Rate limiting pause between batches
      if (i + batchSize < texts.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility function to combine text fields for embedding
  static combineTextFields(record: any): string {
    const fields = [
      record.hfm_entity,
      record.hfm_cost_group,
      record.account,
      record.cost_center
    ].filter(Boolean);
    
    return fields.join(' | ');
  }

  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // Test the embedding service
  async testEmbedding(): Promise<{ success: boolean; provider: string; dimensions: number }> {
    try {
      const testText = "Manufacturing overhead expenses for maintenance";
      const embedding = await this.generateEmbedding(testText);
      
      return {
        success: true,
        provider: this.config.provider,
        dimensions: embedding.length
      };
    } catch (error) {
      console.error('Embedding test failed:', error);
      return {
        success: false,
        provider: this.config.provider,
        dimensions: 0
      };
    }
  }
}

export default EmbeddingService;