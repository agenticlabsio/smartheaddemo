# FinSight Data Files Organization

This directory contains the organized CSV data files for the multi-dataset FinSight financial transaction analysis platform.

## Directory Structure

### `/coupa/` - Coupa Financial Data
- `coupa_spending_original.csv` - Original financial data from the legacy system (26,111 records, $48.8M)
- `coupa_spending_updated.csv` - Updated Coupa data with recent transactions

### `/baan/` - Baan ERP Procurement Data  
- `baan_spending.csv` - Baan ERP procurement data from Asheville operations (14,768 records, $37.8M)

## Data Sources Overview

### Coupa Data (Financial ERP)
- **Records**: 26,111 transactions
- **Value**: $48.8M total dataset  
- **Period**: FY2023-2025 (Q1-Q2 2025 partial)
- **Entities**: 8 business entities (LEAsheville variants, LETiger operations)
- **Structure**: HFM entities, cost groups, cost centers, GL accounts

### Baan Data (Procurement ERP)
- **Records**: 14,768 transactions
- **Value**: $37.8M total dataset
- **Period**: 2025 data (January-June)
- **Suppliers**: 392 unique suppliers
- **Commodities**: 103 commodity categories
- **Location**: Asheville operations only
- **Structure**: Suppliers, commodities, invoices, PO ship-to locations

## Database Integration

- **Coupa Data**: Imported into `financial_data` table via `/api/database/setup` with dataType='coupa'
- **Baan Data**: Imported into `baanspending` table via `/api/database/setup` with dataType='baan'

## Usage

These files serve as source data for the database import process and can be used for:
- Data validation and verification
- Backup and recovery operations  
- Data analysis and reporting outside the main application
- Historical data tracking and audit trails

Last Updated: September 23, 2025