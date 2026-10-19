SET SERVEROUTPUT ON;
DECLARE

    lv_status VARCHAR2(2000);

    PROCEDURE log_msg(p_msg IN VARCHAR2) IS
    BEGIN
      DBMS_OUTPUT.PUT_LINE(p_msg);
    END log_msg;

    PROCEDURE log_error(p_msg IN VARCHAR2) IS
    BEGIN
      DBMS_OUTPUT.PUT_LINE('ERROR: ' || p_msg);
    END log_error;
    
  PROCEDURE POPULATE_API_TABLES(p_laptop_id IN VARCHAR2, p_upload_id IN VARCHAR2, p_status OUT VARCHAR2) IS

    CURSOR tbl_metadata_cur(p_table_name IN VARCHAR2) IS
      SELECT column_id, table_name, column_name, data_type, data_length
        FROM all_tab_columns
       WHERE UPPER(table_name) = UPPER(p_table_name)
       order by column_id asc;

    CURSOR str_token_cur(l_string_in IN VARCHAR2) IS
      WITH DATA AS
       (SELECT TRIM(SUBSTR(txt,
                           INSTR(txt, '|', 1, LEVEL) + 1,
                           INSTR(txt, '|', 1, LEVEL + 1) -
                           INSTR(txt, '|', 1, LEVEL) - 1)) AS str_token
          FROM (SELECT '|' || l_string_in || '|' txt FROM DUAL)
        CONNECT BY LEVEL <= LENGTH(l_string_in) -
                   LENGTH(REPLACE(l_string_in, '|', '')) + 1)
      SELECT str_token FROM DATA;

    CURSOR laptop_tbl_cur IS
      SELECT table_name, file_name, count(1) cnt
        FROM lt_laptop_staging
       WHERE NVL(process_flag, 'N') = 'P'
         AND upload_id = p_upload_id
       GROUP BY table_name, file_name;

    CURSOR decrypt_str_cur(pl_tbl_name IN VARCHAR2) IS
      SELECT decrypt_data_string, table_name, laptop_id, file_name, upload_id
        FROM lt_laptop_staging
       WHERE NVL(process_flag, 'N') = 'P'
         AND upload_id = p_upload_id
         AND table_name = pl_tbl_name
         FOR UPDATE OF decrypt_data_string; -- Populate only Processed data into api_tables

    TYPE arr_type IS TABLE OF VARCHAR2(500) INDEX BY BINARY_INTEGER;

    TYPE dates_byCollID_aat IS TABLE OF BOOLEAN INDEX BY PLS_INTEGER;
    dates_byCollID dates_byCollID_aat;

    TABLE_DOES_NOT_EXIST exception;
    pragma exception_init(TABLE_DOES_NOT_EXIST, -942);

    COL_STR_MISMATCH exception;
    pragma exception_init(COL_STR_MISMATCH, -6502);

    exit_process EXCEPTION;

    t_arr     ARR_TYPE;
    l_col_names VARCHAR2(4000) := NULL;
    l_values  VARCHAR2(4000) := NULL;
    l_api_tbl VARCHAR2(30);
    --l_msg VARCHAR2(1000);
    i         NUMBER := 1;

    l_col_idx  NUMBER;


    l_row_cnt NUMBER;
    lc_dt_fmt  VARCHAR2(20) := 'MM/DD/YYYY HH24MI'; -- Date Format;

    lc_pgm_id  VARCHAR2(30) := 'POPULATE_API_TABLES';

    sqlStmt  VARCHAR2(2000);
    lv_tbl_cols  VARCHAR2(1000);
    lv_api_tbl_cols  VARCHAR2(1000);

    -- cached audit table names that do not follow the api_<main-tablename> standard.
    TYPE api_adt_tnames_t IS TABLE OF VARCHAR2(30) INDEX BY VARCHAR2(30);
    api_adt_tnames      api_adt_tnames_t;
    lv_api_tname    VARCHAR2(30);
    lv_tname        VARCHAR2(30);

    FUNCTION In_Quotes(char_in VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
      RETURN '''' || char_in || '''';
    END;

    PROCEDURE table_mismatch(p_tbl IN VARCHAR2, p_api_tbl IN VARCHAR2, p_tbl_cols OUT VARCHAR2, p_api_tbl_cols OUT VARCHAR2) IS
    BEGIN
        SELECT LISTAGG(t1.column_name,','), LISTAGG(t2.column_name,',')
          INTO p_tbl_cols, p_api_tbl_cols
        FROM ( SELECT column_name
                 FROM all_tab_columns
                WHERE table_name = UPPER(p_tbl)
             ) t1
           FULL OUTER JOIN 
            (
                SELECT column_name
                FROM all_tab_columns
                WHERE table_name = p_api_tbl
                 AND column_name NOT IN (
                                        'LAPTOP_ID',
                                        'UPLOAD_ID',
                                        'TRANSACTION_MODE',
                                        'LT_UPLOAD_DATE',
                                        'LT_UPLOAD_STATUS',
                                        'LT_UPLOAD_ERROR',
                                        'DATA_SOURCE'
                                        )  
            ) t2 ON t1.column_name = t2.column_name
        WHERE t2.column_name IS NULL 
            OR t1.column_name IS NULL;     
    EXCEPTION
      WHEN OTHERS THEN
        p_tbl_cols := NULL;
        p_api_tbl_cols := NULL;
    END table_mismatch;

    PROCEDURE load_adt_tnames_mismatch IS
    BEGIN
        api_adt_tnames('DONATION_EQUIP_SUPPLY_DET_ADT') := 'API_DONATION_EQP_SUPLY_DET_ADT';
        api_adt_tnames('MATERIAL_SHIPMENT_TUBES_ADT')   := 'API_MATERIAL_SHIPMNT_TUBES_ADT';    
        api_adt_tnames('MATERIAL_VERIFICATION_DET_ADT') := 'API_MATERIAL_VRFCTION_DET_ADT';    
    END load_adt_tnames_mismatch;

  BEGIN
    p_status := 'OK';

    log_msg('Starting API Tables load');

    load_adt_tnames_mismatch;

    FOR rec IN (  SELECT DISTINCT table_name
                    FROM lt_laptop_staging
                   WHERE NVL(process_flag, 'N') = 'P'
                     AND upload_id = p_upload_id
                )
    LOOP
        lv_tname := UPPER(rec.table_name);
        IF api_adt_tnames.EXISTS(lv_tname) THEN
            lv_api_tname := api_adt_tnames(lv_tname);
        ELSE
            lv_api_tname := 'API_' || lv_tname;
        END IF;

        table_mismatch(lv_tname, lv_api_tname, lv_tbl_cols, lv_api_tbl_cols);
        IF lv_tbl_cols IS NOT NULL THEN
           p_status := lv_tbl_cols || ' missing in API table for ' || lv_tname;
           EXIT;
        END IF;
        IF lv_api_tbl_cols IS NOT NULL THEN
           p_status := lv_api_tbl_cols || ' missing in table ' || lv_tname;
           EXIT;
        END IF;
    END LOOP;

    IF p_status <> 'OK' THEN
        RETURN;
    END IF;

    FOR laptop_tbl_rec IN laptop_tbl_cur LOOP
        --l_msg := 'Processing ' || 'API_' || laptop_tbl_rec.table_name || '. Rows found: ' || laptop_tbl_rec.cnt;
        --add_error_log(p_upload_id, p_laptop_id, 'POPULATE_API_TABLES', l_msg, 'LT_PROCESS_STAGING');
        lv_tname := UPPER(laptop_tbl_rec.table_name);
        IF api_adt_tnames.EXISTS(lv_tname) THEN
            l_api_tbl := api_adt_tnames(lv_tname);
        ELSE
            l_api_tbl := 'API_' || lv_tname;
        END IF;

        log_msg('Processing API table: ' || l_api_tbl);

        -- construct column names.
        l_col_names := NULL;
        dates_byCollID.DELETE;

        FOR tbl_metadata_rec IN tbl_metadata_cur(laptop_tbl_rec.table_name) LOOP
           -- Construct column names strings.
           if l_col_names is null then
             l_col_names := tbl_metadata_rec.column_name;
           else
             l_col_names := l_col_names || ', ' || tbl_metadata_rec.column_name;
           end if;

           -- List of column ids that are date dataypes.
           if tbl_metadata_rec.data_type = 'DATE' then
             dates_byCollID(tbl_metadata_rec.column_id) := TRUE;
           end if;
        END LOOP;
        ------------------

        IF l_col_names IS NULL THEN
            p_status := 'ERR: error reading meta data for table - ' || laptop_tbl_rec.table_name;
            raise exit_process;
        END IF;

        -- Add four additional columns not in the table.
        l_col_names := l_col_names || ', transaction_mode, data_source, laptop_id, upload_id' ;

       -- Before inserting, delete any existing records(for the laptop_id and chapter_id) -- V07
        sqlStmt := 'DELETE FROM ' || l_api_tbl || ' WHERE upload_id = :uploadID';
        EXECUTE IMMEDIATE sqlStmt USING p_upload_id;

        l_row_cnt := 0;
        FOR Z1 IN decrypt_str_cur(laptop_tbl_rec.table_name) LOOP
          BEGIN
            l_row_cnt := l_row_cnt + 1;
            --dbms_output.put_line('api table ' || l_api_tbl);
            -- Parse the string and load tokens into plsql table;
            -- Clear the table for every string
            t_arr.delete;
            l_col_idx := 1;
            i         := 1;
            FOR str_rec IN str_token_cur(Z1.decrypt_data_string) LOOP
              -- check for date columns.
              if str_rec.str_token is not null then
                if dates_byCollID.EXISTS(i) THEN
                  t_arr(i) := 'to_date(' || In_Quotes(str_rec.str_token) || ',' || In_Quotes(lc_dt_fmt) || ') ';
                else
                  t_arr(i) := In_Quotes(replace(str_rec.str_token, '''', ''''''));
                end if;
              else
                t_arr(i) := In_Quotes(str_rec.str_token);
              end if;
              i := i + 1;
            END LOOP;

            --dbms_output.put_line('arr count ' || t_arr.COUNT);
            IF t_arr.COUNT = 0 THEN
              p_status := 'ERR: Empty Decrypt Data String in lt_laptop_staging table while processing row - ' || l_row_cnt;
              raise exit_process;
            End IF;
            -----

            -- Construct values string.
            FOR i in 1 .. t_arr.COUNT loop
              if i = 1 then
                l_values := t_arr(1);
              else
                l_values := l_values || ', ' || t_arr(i);
              end if;
            end loop;
             l_values := l_values || ', ' || In_Quotes(laptop_tbl_rec.file_name) || ', ' || In_Quotes(p_laptop_id) || ', ' || In_Quotes(p_upload_id);
            ------

            sqlStmt := 'INSERT INTO ' || l_api_tbl || '(' || l_col_names || ')' || ' VALUES (' || l_values || ')';
            EXECUTE IMMEDIATE sqlStmt;

            UPDATE lt_laptop_staging
               SET process_flag = 'C'
             WHERE CURRENT OF decrypt_str_cur;
          EXCEPTION
            WHEN exit_process THEN
              raise;
            WHEN TABLE_DOES_NOT_EXIST THEN
              p_status := 'ERR: ' || 'API_' || Z1.table_name || ' table does not exist';
              log_error(p_status);
              raise exit_process;
            WHEN COL_STR_MISMATCH THEN
              p_status := 'ERR: ORA-6502: DB Columns and String Mismatch';
              log_error(p_status);
              raise exit_process;
            WHEN others THEN
              p_status := 'ERR: ' ||  SUBSTR(sqlerrm, 1, 900);
              log_error(p_status);
              raise exit_process;
          END;
        END LOOP;

        log_msg(l_api_tbl ||' : Processed row(s) - ' || l_row_cnt || ' of ' || laptop_tbl_rec.cnt);
    END LOOP;

    COMMIT;
    --dbms_output.put_line('after commit');
  EXCEPTION
    WHEN exit_process THEN
        ROLLBACK;
        p_status := l_api_tbl || ' - ' || p_status ;
    WHEN others THEN
        ROLLBACK;
        p_status := l_api_tbl || ' - ' ||  SUBSTR(sqlerrm, 1, 900);
  END populate_api_tables;

BEGIN
 POPULATE_API_TABLES('102', '102_030725143524_IBC', lv_status);

    DBMS_OUTPUT.PUT_LINE('Status: ' || lv_status); 
END;