import fs from 'fs';
import path from 'path';

export interface FinancialRecord {
  'Fiscal Year Number': string;
  'Fiscal Year Month': string;
  'Fiscal Year Week': string;
  'Fiscal Day': string;
  'Finalization Date': string;
  'HFM Entity': string;
  'HFM Cost Group': string;
  'FIM Account': string;
  'Account Code': string;
  'Account': string;
  'Cost Center Code': string;
  'Cost Center': string;
  'Amount': string;
}

export class CSVParser {
  static parseCSVContent(csvContent: string): FinancialRecord[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const records: FinancialRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line handling quoted values
      const values = this.parseCSVLine(line);
      
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || '';
        });
        records.push(record as FinancialRecord);
      }
    }

    return records;
  }

  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current);
    return result;
  }

  static async parseCSVFile(filePath: string): Promise<FinancialRecord[]> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      return this.parseCSVContent(csvContent);
    } catch (error) {
      console.error('Error reading CSV file:', error);
      throw new Error(`Failed to read CSV file: ${error}`);
    }
  }

  static validateRecord(record: FinancialRecord): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!record['Fiscal Year Number']) {
      errors.push('Missing Fiscal Year Number');
    }

    if (!record['HFM Entity']) {
      errors.push('Missing HFM Entity');
    }

    if (!record['Amount']) {
      errors.push('Missing Amount');
    }

    // Validate amount format
    if (record['Amount']) {
      const amountStr = record['Amount'].replace(/[$,\s]/g, '');
      if (isNaN(parseFloat(amountStr))) {
        errors.push('Invalid amount format');
      }
    }

    // Validate fiscal year
    if (record['Fiscal Year Number']) {
      const year = parseInt(record['Fiscal Year Number']);
      if (isNaN(year) || year < 2000 || year > 2030) {
        errors.push('Invalid fiscal year');
      }
    }

    return errors;
  }

  static getDataSummary(records: FinancialRecord[]) {
    const entities = new Set<string>();
    const costGroups = new Set<string>();
    const accounts = new Set<string>();
    let totalAmount = 0;
    let validRecords = 0;
    let invalidRecords = 0;

    records.forEach(record => {
      const errors = this.validateRecord(record);
      
      if (errors.length === 0) {
        validRecords++;
        entities.add(record['HFM Entity']);
        costGroups.add(record['HFM Cost Group']);
        accounts.add(record['Account']);
        
        const amount = parseFloat(record['Amount'].replace(/[$,\s]/g, '')) || 0;
        totalAmount += amount;
      } else {
        invalidRecords++;
      }
    });

    return {
      totalRecords: records.length,
      validRecords,
      invalidRecords,
      uniqueEntities: entities.size,
      uniqueCostGroups: costGroups.size,
      uniqueAccounts: accounts.size,
      totalAmount: totalAmount,
      entities: Array.from(entities).slice(0, 10), // First 10 entities
      costGroups: Array.from(costGroups).slice(0, 10), // First 10 cost groups
    };
  }

  // Generic CSV parsing function that can handle any CSV structure with dynamic headers
  static parseGenericCSVContent(csvContent: string): any[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line handling quoted values
      const values = this.parseCSVLine(line);
      
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || '';
        });
        records.push(record);
      }
    }

    return records;
  }

  static async parseGenericCSVFile(filePath: string): Promise<any[]> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      return this.parseGenericCSVContent(csvContent);
    } catch (error) {
      console.error('Error reading CSV file:', error);
      throw new Error(`Failed to read CSV file: ${error}`);
    }
  }

  static getGenericDataSummary(records: any[], dataType: string = 'unknown') {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        dataType,
        headers: [],
        sampleRecord: null
      };
    }

    const headers = Object.keys(records[0]);
    const sampleRecord = records[0];

    return {
      totalRecords: records.length,
      dataType,
      headers,
      sampleRecord,
      firstFewRecords: records.slice(0, 3)
    };
  }
}

export default CSVParser;