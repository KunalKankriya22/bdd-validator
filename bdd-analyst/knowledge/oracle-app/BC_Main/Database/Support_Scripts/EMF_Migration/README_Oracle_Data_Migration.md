# Oracle Data Migration Scripts for EMF Tables

This repository contains Oracle PL/SQL scripts designed to extract data from EMF (Enterprise Metadata Framework) tables and generate INSERT statements for data migration between environments.

## Files Included

1. **oracle_data_extraction_script.sql** - Basic template script
2. **oracle_dynamic_extraction_script.sql** - Enhanced dynamic script (Recommended)
3. **README_Oracle_Data_Migration.md** - This documentation file

## Tables Covered

The scripts extract data from the following tables:
- `EMF_PARM_DEF` (filtered by PROC_CODE)
- `EMF_PROCESS_MAPPING` (filtered by process_code)
- `EMF_SOURCE_PROCESS` (filtered by process_code)
- `EMF_TARGET_PROCESS` (filtered by process_code)
- `VALID_EMF_PROC_DEF` (filtered by PROC_CODE)

## Recommended Script: oracle_dynamic_extraction_script.sql

### Features
- **Dynamic Column Detection**: Automatically discovers all columns in each table
- **Audit Column Exclusion**: Automatically excludes audit_key columns (populated in destination)
- **Data Type Handling**: Properly formats VARCHAR2, NUMBER, DATE, CLOB, and BLOB data types
- **Error Handling**: Comprehensive error handling for each table
- **Validation**: Input validation for process code parameter
- **Clean Output**: Well-formatted INSERT statements ready for execution

### Usage Instructions

#### Step 1: Prepare the Source Environment
1. Connect to your source Oracle database using SQL*Plus, SQL Developer, or similar tool
2. Ensure you have SELECT privileges on all EMF tables
3. Load the script: `@oracle_dynamic_extraction_script.sql`

#### Step 2: Execute the Script
```sql
-- The script will prompt for process code
SQL> @oracle_dynamic_extraction_script.sql
Enter Process Code: YOUR_PROCESS_CODE_HERE
```

#### Step 3: Capture Output
The script will generate output like:
```sql
-- Data Extraction Script for Process Code: YOUR_PROCESS_CODE
-- Generated on: 2024-01-15 14:30:25
-- ================================================================

-- EMF_PARM_DEF Table Data
-- ========================
INSERT INTO EMF_PARM_DEF (PROC_CODE, PARAM_NAME, PARAM_VALUE, ...) VALUES ('YOUR_PROCESS_CODE', 'param1', 'value1', ...);
-- 1 record(s) processed for EMF_PARM_DEF

-- EMF_PROCESS_MAPPING Table Data
-- ===============================
INSERT INTO EMF_PROCESS_MAPPING (process_code, mapping_id, ...) VALUES ('YOUR_PROCESS_CODE', 123, ...);
-- 2 record(s) processed for EMF_PROCESS_MAPPING

-- ... (continues for all tables)
```

#### Step 4: Apply to Target Environment
1. Copy all the INSERT statements from the output
2. Connect to your target Oracle database
3. Execute the INSERT statements
4. Commit the transaction: `COMMIT;`
5. Verify data integrity

### Script Configuration

#### SQL*Plus Settings
The script automatically configures SQL*Plus for optimal output:
```sql
SET SERVEROUTPUT ON SIZE UNLIMITED;  -- Enable large output
SET PAGESIZE 0;                      -- Remove page breaks
SET LINESIZE 4000;                   -- Wide lines for long INSERT statements
SET FEEDBACK OFF;                    -- Remove execution feedback
SET HEADING OFF;                     -- Remove column headers
SET VERIFY OFF;                      -- Remove variable substitution messages
```

#### Data Type Handling
- **VARCHAR2/CHAR**: Properly escaped with single quotes
- **NUMBER**: Direct numeric values
- **DATE**: Formatted as `TO_DATE('YYYY-MM-DD HH24:MI:SS', 'YYYY-MM-DD HH24:MI:SS')`
- **CLOB**: Placeholder values (manual handling may be required for large CLOBs)
- **BLOB**: NULL values (binary data requires special handling)

### Error Handling

The script includes comprehensive error handling:
- **Table-level errors**: If one table fails, others continue processing
- **Connection errors**: Proper cursor cleanup
- **Data type errors**: Graceful fallback to string handling
- **Empty process code**: Validation before execution

### Limitations and Considerations

1. **Audit Columns**: The script automatically excludes `audit_key` columns from extraction as these are typically populated by the destination environment's audit mechanisms.

2. **CLOB Data**: Large CLOB values are replaced with placeholders. For actual CLOB migration, consider using Oracle Data Pump or custom CLOB handling.

3. **BLOB Data**: Binary data is set to NULL. Use specialized tools for BLOB migration.

4. **Constraints**: The generated INSERT statements don't include constraint handling. Ensure:
   - Primary key conflicts are resolved
   - Foreign key dependencies are satisfied
   - Check constraints are met

5. **Performance**: For large datasets, consider:
   - Running during off-peak hours
   - Using batch processing
   - Monitoring database performance

### Troubleshooting

#### Common Issues

**Issue**: "Table or view does not exist"
**Solution**: Verify table names and ensure proper schema access

**Issue**: "Process code not found"
**Solution**: Verify the process code exists in the source tables

**Issue**: "Output truncated"
**Solution**: Increase SERVEROUTPUT buffer size or redirect output to file

#### Output to File
To save output directly to a file:
```sql
SPOOL output_file.sql
@oracle_dynamic_extraction_script.sql
SPOOL OFF
```

### Best Practices

1. **Test First**: Always test with a small dataset before full migration
2. **Backup**: Create backups of target tables before applying changes
3. **Validate**: Compare record counts between source and target
4. **Document**: Keep track of which process codes have been migrated
5. **Rollback Plan**: Have a rollback strategy ready

### Example Workflow

```sql
-- 1. Connect to source database
sqlplus user/password@source_db

-- 2. Execute extraction script
@oracle_dynamic_extraction_script.sql
-- Enter process code when prompted

-- 3. Save output to file
SPOOL migration_data.sql
@oracle_dynamic_extraction_script.sql
SPOOL OFF

-- 4. Connect to target database
sqlplus user/password@target_db

-- 5. Execute migration
@migration_data.sql
COMMIT;

-- 6. Verify results
SELECT COUNT(*) FROM EMF_PARM_DEF WHERE PROC_CODE = 'YOUR_PROCESS_CODE';
-- Repeat for other tables
```

## Support and Customization

### Adding New Tables
To add additional tables to the extraction:
1. Add a new call to `generate_inserts()` in the main BEGIN block
2. Specify the table name and filter column name
3. Follow the existing pattern

### Modifying Filter Criteria
To change filtering logic:
1. Modify the WHERE clause in the `generate_inserts` procedure
2. Adjust the bind variable handling as needed

### Custom Data Type Handling
To add support for additional Oracle data types:
1. Add new ELSIF conditions in the column definition section
2. Add corresponding value extraction logic
3. Test thoroughly with sample data

## Version History

- **v1.0**: Basic template script with manual column specification
- **v2.0**: Dynamic script with automatic column detection and enhanced error handling
- **v2.1**: Added audit_key column exclusion for proper environment migration

For questions or issues, please consult your database administrator or Oracle documentation.
