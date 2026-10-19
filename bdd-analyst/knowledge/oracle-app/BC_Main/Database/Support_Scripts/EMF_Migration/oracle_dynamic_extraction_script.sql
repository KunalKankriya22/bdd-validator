-- Enhanced Oracle Data Extraction Script for EMF Tables
-- Purpose: Dynamically extract data and generate INSERT statements
-- Features: Automatic column detection, proper data type handling
-- Usage: Execute with process_code parameter

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET PAGESIZE 0;
SET LINESIZE 4000;
SET FEEDBACK OFF;
SET HEADING OFF;
SET NLS_DATE_FORMAT 'YYYY-MM-DD HH24:MI:SS';
SET VERIFY OFF;
SET DEFINE ON;
-- Accept input parameter for process code
--ACCEPT p_process_code CHAR PROMPT 'Enter Process Code: ';


DECLARE
    v_process_code VARCHAR2(100) := '&p_process_code'; -- Replace with '&p_process_code' for dynamic input
    v_sql CLOB;
    v_insert_stmt CLOB;
    v_columns_list CLOB;
    v_values_list CLOB;
    v_column_value VARCHAR2(4000);
    v_count NUMBER := 0;
    
    -- Procedure to generate INSERT statements for any table
    PROCEDURE generate_inserts(
        p_table_name VARCHAR2,
        p_filter_column VARCHAR2,
        p_filter_value VARCHAR2
    ) IS
        v_cursor_id INTEGER;
        v_col_count INTEGER;
        v_desc_tab DBMS_SQL.DESC_TAB;
        v_ret INTEGER;
        v_varchar2_val VARCHAR2(4000);
        v_number_val NUMBER;
        v_date_val DATE;
        v_clob_val CLOB;
        v_blob_val BLOB;
        v_columns CLOB := '';
        v_values CLOB := '';
        v_first_col BOOLEAN := TRUE;
        
    BEGIN
        DBMS_OUTPUT.PUT_LINE('-- ' || p_table_name || ' Table Data');
        DBMS_OUTPUT.PUT_LINE('-- ' || RPAD('=', LENGTH(p_table_name) + 12, '='));
        
        -- Build dynamic SQL
        v_sql := 'SELECT * FROM ' || p_table_name || ' WHERE ' || p_filter_column || ' = :1';
        
        -- Open cursor
        v_cursor_id := DBMS_SQL.OPEN_CURSOR;
        DBMS_SQL.PARSE(v_cursor_id, v_sql, DBMS_SQL.NATIVE);
        DBMS_SQL.BIND_VARIABLE(v_cursor_id, ':1', p_filter_value);
        
        -- Describe the cursor to get column information
        DBMS_SQL.DESCRIBE_COLUMNS(v_cursor_id, v_col_count, v_desc_tab);
        
        -- Define columns based on their data types (excluding audit_key)
        FOR i IN 1..v_col_count LOOP
            -- Skip audit_key column as it will be populated in destination
            IF UPPER(v_desc_tab(i).col_name) != 'AUDIT_KEY' THEN
                IF v_desc_tab(i).col_type = 1 THEN -- VARCHAR2
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_varchar2_val, 4000);
                ELSIF v_desc_tab(i).col_type = 2 THEN -- NUMBER
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_number_val);
                ELSIF v_desc_tab(i).col_type = 12 THEN -- DATE
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_date_val);
                ELSIF v_desc_tab(i).col_type = 112 THEN -- CLOB
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_clob_val);
                ELSIF v_desc_tab(i).col_type = 113 THEN -- BLOB
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_blob_val);
                ELSE
                    DBMS_SQL.DEFINE_COLUMN(v_cursor_id, i, v_varchar2_val, 4000);
                END IF;
            END IF;
        END LOOP;
        
        -- Execute the cursor
        v_ret := DBMS_SQL.EXECUTE(v_cursor_id);
        
        -- Fetch and process each row
        WHILE DBMS_SQL.FETCH_ROWS(v_cursor_id) > 0 LOOP
            -- Build column list (only once, excluding audit_key)
            IF v_columns IS NULL OR LENGTH(v_columns) = 0 THEN
                v_first_col := TRUE;
                FOR i IN 1..v_col_count LOOP
                    -- Skip audit_key column as it will be populated in destination
                    IF UPPER(v_desc_tab(i).col_name) != 'AUDIT_KEY' THEN
                        IF NOT v_first_col THEN
                            v_columns := v_columns || ', ';
                        END IF;
                        v_columns := v_columns || v_desc_tab(i).col_name;
                        v_first_col := FALSE;
                    END IF;
                END LOOP;
            END IF;
            
            -- Build values list for current row
            v_values := '';
            v_first_col := TRUE;
            
            FOR i IN 1..v_col_count LOOP
                -- Skip audit_key column as it will be populated in destination
                IF UPPER(v_desc_tab(i).col_name) != 'AUDIT_KEY' THEN
                    IF NOT v_first_col THEN
                        v_values := v_values || ', ';
                    END IF;
                    
                    -- Get column value based on data type
                    IF v_desc_tab(i).col_type = 1 THEN -- VARCHAR2
                        DBMS_SQL.COLUMN_VALUE(v_cursor_id, i, v_varchar2_val);
                        IF v_varchar2_val IS NULL THEN
                            v_values := v_values || 'NULL';
                        ELSE
                            v_values := v_values || '''' || REPLACE(v_varchar2_val, '''', '''''') || '''';
                        END IF;
                    ELSIF v_desc_tab(i).col_type = 2 THEN -- NUMBER
                        DBMS_SQL.COLUMN_VALUE(v_cursor_id, i, v_number_val);
                        IF v_number_val IS NULL THEN
                            v_values := v_values || 'NULL';
                        ELSE
                            v_values := v_values || TO_CHAR(v_number_val);
                        END IF;
                    ELSIF v_desc_tab(i).col_type = 12 THEN -- DATE
                        DBMS_SQL.COLUMN_VALUE(v_cursor_id, i, v_date_val);
                        IF v_date_val IS NULL THEN
                            v_values := v_values || 'NULL';
                        ELSE
                            v_values := v_values || 'TO_DATE(''' || TO_CHAR(v_date_val, 'YYYY-MM-DD HH24:MI:SS') || ''', ''YYYY-MM-DD HH24:MI:SS'')';
                        END IF;
                    ELSIF v_desc_tab(i).col_type = 112 THEN -- CLOB
                        DBMS_SQL.COLUMN_VALUE(v_cursor_id, i, v_clob_val);
                        IF v_clob_val IS NULL THEN
                            v_values := v_values || 'NULL';
                        ELSE
                            -- For CLOB, we'll use a placeholder or truncate for INSERT
                            v_values := v_values || '''CLOB_DATA_' || i || '''';
                        END IF;
                    ELSIF v_desc_tab(i).col_type = 113 THEN -- BLOB
                        v_values := v_values || 'NULL'; -- BLOB handling would require special processing
                    ELSE
                        DBMS_SQL.COLUMN_VALUE(v_cursor_id, i, v_varchar2_val);
                        IF v_varchar2_val IS NULL THEN
                            v_values := v_values || 'NULL';
                        ELSE
                            v_values := v_values || '''' || REPLACE(v_varchar2_val, '''', '''''') || '''';
                        END IF;
                    END IF;
                    
                    v_first_col := FALSE;
                END IF;
            END LOOP;
            
            -- Output the INSERT statement
            v_insert_stmt := 'INSERT INTO ' || p_table_name || ' (' || v_columns || ') VALUES (' || v_values || ');';
            DBMS_OUTPUT.PUT_LINE(v_insert_stmt);
            
            v_count := v_count + 1;
        END LOOP;
        
        -- Close cursor
        DBMS_SQL.CLOSE_CURSOR(v_cursor_id);
        
        IF v_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('-- No records found for process code: ' || p_filter_value);
        ELSE
            DBMS_OUTPUT.PUT_LINE('-- ' || v_count || ' record(s) processed for ' || p_table_name);
        END IF;
        
        DBMS_OUTPUT.PUT_LINE('');
        
    EXCEPTION
        WHEN OTHERS THEN
            IF DBMS_SQL.IS_OPEN(v_cursor_id) THEN
                DBMS_SQL.CLOSE_CURSOR(v_cursor_id);
            END IF;
            DBMS_OUTPUT.PUT_LINE('-- Error processing ' || p_table_name || ': ' || SQLERRM);
            DBMS_OUTPUT.PUT_LINE('');
    END generate_inserts;

BEGIN
    DBMS_OUTPUT.PUT_LINE('-- Data Extraction Script for Process Code: ' || v_process_code);
    DBMS_OUTPUT.PUT_LINE('-- Generated on: ' || TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'));
    DBMS_OUTPUT.PUT_LINE('-- ================================================================');
    DBMS_OUTPUT.PUT_LINE('');

    DBMS_OUTPUT.PUT_LINE('SET DEFINE OFF;');
    DBMS_OUTPUT.PUT_LINE('SET SQLBLANKLINES ON;');
    
    -- Validate that process code is provided
    IF v_process_code IS NULL OR TRIM(v_process_code) = '' THEN
        DBMS_OUTPUT.PUT_LINE('-- ERROR: Process code cannot be empty');
        RETURN;
    END IF;
    
    -- Extract data from each table
    generate_inserts('EMF_PARM_DEF', 'PROC_CODE', v_process_code);
    generate_inserts('EMF_PROCESS_MAPPING', 'process_code', v_process_code);
    generate_inserts('EMF_SOURCE_PROCESS', 'process_code', v_process_code);
    generate_inserts('EMF_TARGET_PROCESS', 'process_code', v_process_code);
    generate_inserts('VALID_EMF_PROC_DEF', 'PROC_CODE', v_process_code);
    
    DBMS_OUTPUT.PUT_LINE('-- End of extraction for Process Code: ' || v_process_code);
    DBMS_OUTPUT.PUT_LINE('-- ================================================================');
    DBMS_OUTPUT.PUT_LINE('-- Instructions for target environment:');
    DBMS_OUTPUT.PUT_LINE('-- 1. Copy the INSERT statements above');
    DBMS_OUTPUT.PUT_LINE('-- 2. Execute them in the target database');
    DBMS_OUTPUT.PUT_LINE('-- 3. Commit the transaction');
    DBMS_OUTPUT.PUT_LINE('-- 4. Verify data integrity');
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('-- Fatal error occurred: ' || SQLERRM);
        RAISE;
END;
/

-- Reset SQL*Plus settings
SET FEEDBACK ON;
SET HEADING ON;
SET VERIFY ON;
