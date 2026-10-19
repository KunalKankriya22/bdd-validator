CREATE OR REPLACE PROCEDURE delete_donor_unit_data(
    p_donor_id IN NUMBER,
    p_unit_id IN VARCHAR2
)
AS
    v_sql VARCHAR2(4000);
    v_count NUMBER;
    v_total_deleted NUMBER := 0;
    v_schema VARCHAR2(30);
    v_error_msg VARCHAR2(4000);
    v_log_file UTL_FILE.FILE_TYPE;
    v_log_dir VARCHAR2(30) := 'BLOOD_CENTER_LOG_DIR';  -- Directory object name
    v_log_file_name VARCHAR2(100);
    
    -- Helper procedure to write to both log file and DBMS_OUTPUT
    PROCEDURE write_log(p_message IN VARCHAR2) IS
    BEGIN
        DBMS_OUTPUT.PUT_LINE(p_message);
        UTL_FILE.PUT_LINE(v_log_file, TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.FF') || ' - ' || p_message);
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error writing to log file: ' || SQLERRM);
    END write_log;
    
BEGIN
    -- Create log file with timestamp in name
    v_log_file_name := 'delete_donor_unit_data_' || 
                       TO_CHAR(SYSDATE, 'YYYYMMDD_HH24MISS') || 
                       '_' || NVL(TO_CHAR(p_donor_id), 'NULL') ||
                       '_' || NVL(p_unit_id, 'NULL') || '.log';
                       
    -- Open log file
    v_log_file := UTL_FILE.FOPEN(v_log_dir, v_log_file_name, 'W', 32767);

    -- Parameter validation
    IF p_donor_id IS NULL AND p_unit_id IS NULL THEN
        write_log('Error: Both donor_id and unit_id cannot be NULL');
        UTL_FILE.FCLOSE(v_log_file);
        RAISE_APPLICATION_ERROR(-20001, 'Both donor_id and unit_id cannot be NULL');
    END IF;

    write_log('=== Starting deletion process ===');
    write_log('donor_id: ' || NVL(TO_CHAR(p_donor_id), 'NULL'));
    write_log('unit_id: ' || NVL(p_unit_id, 'NULL'));
    write_log('Log file: ' || v_log_file_name);
    write_log('----------------------------------------');
    
    -- Find and process tables with donor_id or unit_id columns
    FOR table_rec IN (
        WITH table_columns AS (
            SELECT c.owner, 
                   c.table_name, 
                   t.table_type,
                   t.num_rows,
                   LISTAGG(LOWER(c.column_name), ',') WITHIN GROUP (ORDER BY c.column_name) as columns
            FROM all_tab_columns c
            JOIN all_tables t ON c.owner = t.owner 
                            AND c.table_name = t.table_name
            WHERE c.owner in ('DONSYS', 'SBCSYS', 'UTIL', 'SRVSYS')
            AND LOWER(c.column_name) IN ('donor_id', 'unit_id')
            AND c.table_name NOT LIKE '%\_ADT' ESCAPE '\'
            AND c.table_name NOT LIKE '%\_AUDIT' ESCAPE '\'
            GROUP BY c.owner, c.table_name, t.table_type, t.num_rows
        )
        SELECT 
            owner,
            table_name,
            table_type,
            num_rows,
            columns,
            CASE 
                WHEN columns LIKE '%donor_id%' AND columns LIKE '%unit_id%' AND p_donor_id IS NOT NULL AND p_unit_id IS NOT NULL THEN
                    'WHERE donor_id = :1 AND unit_id = :2'
                WHEN columns LIKE '%donor_id%' AND p_donor_id IS NOT NULL THEN
                    'WHERE donor_id = :1'
                WHEN columns LIKE '%unit_id%' AND p_unit_id IS NOT NULL THEN
                    'WHERE unit_id = :1'
                ELSE
                    NULL
            END as where_clause
        FROM table_columns
        ORDER BY owner, table_name
    ) LOOP
        BEGIN
            -- Skip if no valid where clause (based on NULL parameters)
            IF table_rec.where_clause IS NULL THEN
                CONTINUE;
            END IF;

            write_log('Processing ' || table_rec.owner || '.' || table_rec.table_name || 
                     ' (Type: ' || table_rec.table_type || 
                     ', Approx. Rows: ' || NVL(TO_CHAR(table_rec.num_rows), 'Unknown') || ')');

            -- Count records before deletion
            v_sql := 'SELECT COUNT(*) FROM ' || table_rec.owner || '.' || table_rec.table_name || ' ' || table_rec.where_clause;
            
            BEGIN
                IF table_rec.columns LIKE '%donor_id%' AND table_rec.columns LIKE '%unit_id%' THEN
                    EXECUTE IMMEDIATE v_sql INTO v_count USING p_donor_id, p_unit_id;
                ELSIF table_rec.columns LIKE '%donor_id%' THEN
                    EXECUTE IMMEDIATE v_sql INTO v_count USING p_donor_id;
                ELSE
                    EXECUTE IMMEDIATE v_sql INTO v_count USING p_unit_id;
                END IF;
                
                write_log('Records found: ' || v_count);
                
                -- Only proceed with delete if records exist
                IF v_count > 0 THEN
                    -- Delete records
                    v_sql := 'DELETE FROM ' || table_rec.owner || '.' || table_rec.table_name || ' ' || table_rec.where_clause;
                    
                    IF table_rec.columns LIKE '%donor_id%' AND table_rec.columns LIKE '%unit_id%' THEN
                        EXECUTE IMMEDIATE v_sql USING p_donor_id, p_unit_id;
                    ELSIF table_rec.columns LIKE '%donor_id%' THEN
                        EXECUTE IMMEDIATE v_sql USING p_donor_id;
                    ELSE
                        EXECUTE IMMEDIATE v_sql USING p_unit_id;
                    END IF;
                    
                    v_total_deleted := v_total_deleted + SQL%ROWCOUNT;
                    
                    write_log('Records deleted: ' || SQL%ROWCOUNT);
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    v_error_msg := SQLERRM;
                    write_log('Error: ' || v_error_msg);
                    -- Continue with next table
            END;
            
            write_log('----------------------------------------');
        END;
    END LOOP;
    
    write_log('=== Deletion process completed ===');
    write_log('Total records deleted: ' || v_total_deleted);
    
    -- Commit the transaction if any records were deleted
    IF v_total_deleted > 0 THEN
        COMMIT;
        write_log('Changes committed successfully');
    ELSE
        write_log('No records were deleted');
    END IF;
    
    -- Close log file
    UTL_FILE.FCLOSE(v_log_file);
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        IF UTL_FILE.IS_OPEN(v_log_file) THEN
            write_log('Fatal error occurred: ' || SQLERRM);
            write_log('Transaction rolled back');
            UTL_FILE.FCLOSE(v_log_file);
        ELSE
            DBMS_OUTPUT.PUT_LINE('Fatal error occurred: ' || SQLERRM);
            DBMS_OUTPUT.PUT_LINE('Transaction rolled back');
        END IF;
        RAISE;
END delete_donor_unit_data;
/

-- Show errors if any
SHOW ERRORS;

-- Create directory object (needs DBA privileges)
/*
CREATE OR REPLACE DIRECTORY BLOOD_CENTER_LOG_DIR AS '/path/to/log/directory';
GRANT READ, WRITE ON DIRECTORY BLOOD_CENTER_LOG_DIR TO <schema_name>;
*/

-- Example usage:
/*
-- Execute with both parameters:
EXEC delete_donor_unit_data(donor_id => 12345, unit_id => 'U12345');

-- Execute with only donor_id:
EXEC delete_donor_unit_data(donor_id => 12345, unit_id => NULL);

-- Execute with only unit_id:
EXEC delete_donor_unit_data(donor_id => NULL, unit_id => 'U12345');
*/
