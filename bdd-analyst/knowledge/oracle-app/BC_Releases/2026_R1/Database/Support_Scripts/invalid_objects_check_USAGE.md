# Invalid Objects Check Script Usage Guide

## Overview
The `invalid_objects_check.sql` script provides comprehensive analysis of invalid database objects in your Oracle schema.

## Features
- **Complete Invalid Object Detection**: Finds all invalid procedures, functions, packages, triggers, views, materialized views, and other objects
- **Detailed Error Analysis**: Shows compilation errors with line numbers and positions
- **Dependency Analysis**: Identifies object dependencies and dependency chains
- **Automatic Remediation**: Generates recompilation scripts
- **Summary Reports**: Provides statistics and categorized reporting

## Usage

### Basic Execution
```sql
-- Connect to your Oracle database
sqlplus username/password@database

-- Execute the script
@invalid_objects_check.sql
```

### Alternative Execution Methods
```sql
-- In SQL Developer or similar tools
@invalid_objects_check.sql

-- Or copy and paste the script content directly
```

## Output Sections

### 1. Summary
- Total objects in schema
- Number of invalid objects
- Invalid object percentage

### 2. Invalid Objects by Type
- Breakdown by object type (procedures, functions, etc.)
- Count of invalid objects per type

### 3. Detailed Analysis
For each invalid object:
- Object name and type
- Last DDL time
- Compilation errors (if any)
- Dependencies

### 4. Dependency Chain Analysis
- Shows how invalid objects relate to each other
- Helps identify root causes

### 5. Problematic Dependencies
- Objects that are causing other objects to be invalid

### 6. Remediation Script
- Ready-to-execute compilation commands
- Both individual and batch compilation options

### 7. Recommendations
- Best practices for fixing invalid objects
- Troubleshooting guidance

### 8. System Utilities
- Oracle built-in utilities for mass recompilation

## Sample Output
```
=================================================================
Oracle Database Invalid Objects Analysis Report
Generated on: 2024-01-15 14:30:25
Database User: MYUSER
=================================================================

1. SUMMARY
----------
Total Objects in Schema: 150
Invalid Objects Found: 5
Invalid Object Percentage: 3.33%

2. INVALID OBJECTS BY TYPE
---------------------------
PROCEDURE           : 3 invalid
FUNCTION            : 1 invalid
PACKAGE BODY        : 1 invalid
```

## Remediation Steps

### Automatic Compilation
The script generates compilation commands you can execute:
```sql
ALTER PROCEDURE my_procedure COMPILE;
ALTER FUNCTION my_function COMPILE;
ALTER PACKAGE my_package COMPILE BODY;
```

### Batch Compilation
For multiple objects, use the generated PL/SQL block or Oracle utilities:
```sql
-- Oracle built-in utility
EXEC DBMS_UTILITY.COMPILE_SCHEMA('YOUR_SCHEMA');

-- System script (Oracle 10g+)
@$ORACLE_HOME/rdbms/admin/utlrp.sql
```

## Troubleshooting

### Common Issues
1. **No output**: Check SERVEROUTPUT is enabled
2. **Permission errors**: Ensure SELECT privileges on USER_OBJECTS, USER_ERRORS, USER_DEPENDENCIES
3. **Compilation failures**: Review error messages for syntax or dependency issues

### Best Practices
1. Run during maintenance windows
2. Fix dependency issues first (bottom-up approach)
3. Re-run script after fixes to verify success
4. Keep backups before making changes

## Integration with EMF Migration
This script complements your existing EMF migration scripts by:
- Validating database health before migration
- Identifying objects that need attention
- Ensuring clean migration environment

## Requirements
- Oracle Database (any version with USER_OBJECTS views)
- SELECT privileges on system views
- SERVEROUTPUT enabled for full reporting
