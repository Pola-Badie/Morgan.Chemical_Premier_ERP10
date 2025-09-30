# Product Import Guide - Premier ERP System

## Available Import Methods

### 1. CSV File Import with Warehouse Selection
Upload CSV files via the Inventory page import dialog with automatic warehouse assignment.

### 2. JSON Bulk Import
Direct API import for programmatic data integration.

## Warehouse Assignment Options

The system supports importing products to specific warehouses. Available warehouses:

| Warehouse ID | Warehouse Name |
|-------------|----------------|
| 1 | Main Warehouse |
| 2 | Temperature-Controlled Storage |
| 3 | Raw Materials Section |
| 4 | Medical Supplies Warehouse |
| 5 | Finished Goods Area |
| 6 | Packaging |

## CSV Template Fields

### Required Fields
- **name**: Product name
- **sku**: Unique product identifier (SKU)

### Core Product Fields
- **drugName**: Chemical/generic name
- **costPrice**: Purchase cost per unit
- **sellingPrice**: Sales price per unit
- **quantity**: Current stock quantity
- **unitOfMeasure**: Unit (PCS, L, KG, Tablets, etc.)

### Optional Fields
- **location**: Warehouse location (overridden by warehouse selection)
- **description**: Product description
- **lowStockThreshold**: Minimum stock level
- **status**: Product status (active/inactive)
- **categoryId**: Category ID (1=Finished, 2=Raw, 3=Packaging)
- **productType**: Type (finished/raw/packaging)
- **expiryDate**: Expiration date (YYYY-MM-DD format)

## Import Process

### Using the Web Interface
1. Go to Inventory page
2. Click "Import Products" button
3. Select warehouse from dropdown (optional)
4. Choose CSV file
5. Click "Import"

### Using API Endpoints

#### CSV Import
```bash
curl -X POST -F "type=products" -F "warehouse=3" -F "file=@yourfile.csv" http://localhost:5000/api/bulk-import
```

#### JSON Import
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"type":"products","data":[{...}],"warehouse":"5"}' \
  http://localhost:5000/api/bulk/import-json
```

## Sample Files

### Basic Template: `Product_Import_Template.csv`
Contains 10 sample products with all supported fields.

### Extended Sample: `Product_Import_Sample_With_Warehouses.csv`
Contains 15 comprehensive product examples showing various product types:
- Finished pharmaceutical products
- Raw materials
- Packaging supplies
- Different units of measure
- Various warehouse assignments

## Important Notes

### Duplicate Handling
- System uses **upsert** functionality
- Existing products (same SKU) will be updated
- New products will be created
- No duplicate SKU errors

### Warehouse Assignment Priority
1. **Warehouse parameter** (if specified during import)
2. **location** field in CSV
3. **"Main Warehouse"** (default)

### Data Validation
- Cost and selling prices must be numeric
- Quantities must be whole numbers
- Dates must be in valid format (YYYY-MM-DD)
- SKU must be unique per product

### Units of Measure Supported
- PCS (Pieces)
- L (Liters)
- KG (Kilograms)
- Tablets
- Capsules
- Bottles
- Vials
- Tubes
- T (Tons)
- g (Grams)
- mg (Milligrams)

## Error Handling

The import system provides detailed feedback:
- **Success count**: Number of products imported
- **Failed count**: Number of failed imports  
- **Error details**: Specific error messages for failed rows

## Best Practices

1. **Test with small batches** before importing large datasets
2. **Use consistent SKU format** across your organization
3. **Specify warehouse** during import for accurate location tracking
4. **Include expiry dates** for pharmaceutical products
5. **Set appropriate stock thresholds** for inventory management
6. **Use descriptive product names** for easy identification

## Example Workflow

1. Download `Product_Import_Template.csv`
2. Replace sample data with your products
3. Choose target warehouse in import dialog
4. Upload and import
5. Verify products appear in selected warehouse
6. Set up stock level alerts if needed

This system is designed to handle pharmaceutical inventory with compliance requirements while maintaining flexibility for various product types and warehouse configurations.