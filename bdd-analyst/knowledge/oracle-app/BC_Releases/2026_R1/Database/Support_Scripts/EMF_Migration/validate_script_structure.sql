-- Validation Script for Oracle Data Extraction Scripts
-- Purpose: Test script structure and validate table access
-- Usage: Run this before executing the main extraction scripts

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET FEEDBACK ON;
SET HEADING ON;

DECLARE
    v_banner VARCHAR2(4000);
    v_table_count NUMBER;
    v_column_count NUMBER;
    v_error_count NUMBER := 0;
    
    TYPE t_table_info IS RECORD (
        table_name VARCHAR2(128),
        filter_column VARCHAR2(128)
    );
    
    TYPE t_tables_tab IS TABLE OF t_table_info;
    
    v_tables t_tables_tab := t_tables_tab(
        t_table_info('EMF_PARM_DEF', 'PROC_CODE'),
        t_table_info('EMF_PROCESS_MAPPING', 'PROCESS_CODE'),
        t_table_info('EMF_SOURCE_PROCESS', 'PROCESS_CODE'),
        t_table_info('EMF_TARGET_PROCESS', 'PROCESS_CODE'),
        t_table_info('VALID_EMF_PROC_DEF', 'PROC_CODE')
    );
    
BEGIN
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    DBMS_OUTPUT.PUT_LINE('Oracle Data Extraction Script Validation');
    DBMS_OUTPUT.PUT_LINE('Generated on: ' || TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'));
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Check Oracle version and capabilities
    DBMS_OUTPUT.PUT_LINE('1. Oracle Environment Check');
    DBMS_OUTPUT.PUT_LINE('---------------------------');
    
    BEGIN
        SELECT banner INTO v_banner FROM v$version WHERE ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('Oracle Version: Available');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Warning: Cannot access v$version - ' || SQLERRM);
    END;
    
    -- Check DBMS_SQL package availability
    BEGIN
        v_table_count := DBMS_SQL.OPEN_CURSOR;
        DBMS_SQL.CLOSE_CURSOR(v_table_count);
        DBMS_OUTPUT.PUT_LINE('DBMS_SQL Package: Available');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('ERROR: DBMS_SQL package not available - ' || SQLERRM);
            v_error_count := v_error_count + 1;
    END;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Check table existence and access
    DBMS_OUTPUT.PUT_LINE('2. Table Access Validation');
    DBMS_OUTPUT.PUT_LINE('---------------------------');
    
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            -- Check if table exists and is accessible
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || v_tables(i).table_name || ' WHERE ROWNUM <= 1'
                INTO v_table_count;
            
            DBMS_OUTPUT.PUT_LINE('✓ ' || v_tables(i).table_name || ': Accessible');
            
            -- Check if filter column exists
            SELECT COUNT(*)
            INTO v_column_count
            FROM user_tab_columns
            WHERE table_name = v_tables(i).table_name
            AND column_name = v_tables(i).filter_column;
            
            IF v_column_count > 0 THEN
                DBMS_OUTPUT.PUT_LINE('  ✓ Filter column ' || v_tables(i).filter_column || ': Found');
            ELSE
                DBMS_OUTPUT.PUT_LINE('  ✗ Filter column ' || v_tables(i).filter_column || ': NOT FOUND');
                v_error_count := v_error_count + 1;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('✗ ' || v_tables(i).table_name || ': NOT ACCESSIBLE - ' || SQLERRM);
                v_error_count := v_error_count + 1;
        END;
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Check column metadata access
    DBMS_OUTPUT.PUT_LINE('3. Metadata Access Validation');
    DBMS_OUTPUT.PUT_LINE('------------------------------');
    
    BEGIN
        SELECT COUNT(*)
        INTO v_column_count
        FROM user_tab_columns
        WHERE ROWNUM <= 1;
        
        DBMS_OUTPUT.PUT_LINE('✓ USER_TAB_COLUMNS: Accessible');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('✗ USER_TAB_COLUMNS: NOT ACCESSIBLE - ' || SQLERRM);
            v_error_count := v_error_count + 1;
    END;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Display table structures
    DBMS_OUTPUT.PUT_LINE('4. Table Structure Information');
    DBMS_OUTPUT.PUT_LINE('------------------------------');
    
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            DBMS_OUTPUT.PUT_LINE('Table: ' || v_tables(i).table_name);
            
            SELECT COUNT(*)
            INTO v_column_count
            FROM user_tab_columns
            WHERE table_name = v_tables(i).table_name;
            
            DBMS_OUTPUT.PUT_LINE('  Columns: ' || v_column_count);
            
            -- Show first few columns as sample
            FOR col_rec IN (
                SELECT column_name, data_type, data_length, nullable
                FROM user_tab_columns
                WHERE table_name = v_tables(i).table_name
                AND ROWNUM <= 5
                ORDER BY column_id
            ) LOOP
                DBMS_OUTPUT.PUT_LINE('    ' || col_rec.column_name || ' (' || 
                    col_rec.data_type || 
                    CASE WHEN col_rec.data_length IS NOT NULL THEN '(' || col_rec.data_length || ')' END ||
                    CASE WHEN col_rec.nullable = 'N' THEN ' NOT NULL' END || ')');
            END LOOP;
            
            IF v_column_count > 5 THEN
                DBMS_OUTPUT.PUT_LINE('    ... and ' || (v_column_count - 5) || ' more columns');
            END IF;
            
            DBMS_OUTPUT.PUT_LINE('');
            
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE('  Error accessing structure: ' || SQLERRM);
        END;
    END LOOP;
    
    -- Sample data check
    DBMS_OUTPUT.PUT_LINE('5. Sample Data Check');
    DBMS_OUTPUT.PUT_LINE('--------------------');
    
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM ' || v_tables(i).table_name
                INTO v_table_count;
            
            DBMS_OUTPUT.PUT_LINE(v_tables(i).table_name || ': ' || v_table_count || ' total records');
            
            -- Check for distinct process codes
            EXECUTE IMMEDIATE 'SELECT COUNT(DISTINCT ' || v_tables(i).filter_column || ') FROM ' || v_tables(i).table_name
                INTO v_column_count;
            
            DBMS_OUTPUT.PUT_LINE('  Distinct ' || v_tables(i).filter_column || ' values: ' || v_column_count);
            
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE(v_tables(i).table_name || ': Error counting records - ' || SQLERRM);
        END;
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Final validation summary
    DBMS_OUTPUT.PUT_LINE('6. Validation Summary');
    DBMS_OUTPUT.PUT_LINE('---------------------');
    
    IF v_error_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('✓ ALL CHECKS PASSED');
        DBMS_OUTPUT.PUT_LINE('  The extraction scripts should work correctly.');
        DBMS_OUTPUT.PUT_LINE('  You can proceed with running oracle_dynamic_extraction_script.sql');
    ELSE
        DBMS_OUTPUT.PUT_LINE('✗ ' || v_error_count || ' ERROR(S) FOUND');
        DBMS_OUTPUT.PUT_LINE('  Please resolve the issues above before running the extraction scripts.');
        DBMS_OUTPUT.PUT_LINE('  Common solutions:');
        DBMS_OUTPUT.PUT_LINE('  - Verify table names and schema access');
        DBMS_OUTPUT.PUT_LINE('  - Check user privileges (SELECT on tables, EXECUTE on DBMS_SQL)');
        DBMS_OUTPUT.PUT_LINE('  - Confirm column names match your database schema');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('FATAL ERROR in validation script: ' || SQLERRM);
        RAISE;
END;
/

-- Show current user and privileges
PROMPT
PROMPT Current User Information:
PROMPT ========================
SELECT USER as current_user, 
       TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') as current_time
FROM dual;

PROMPT
PROMPT To run the extraction script, use:
PROMPT @oracle_dynamic_extraction_script.sql
PROMPT
