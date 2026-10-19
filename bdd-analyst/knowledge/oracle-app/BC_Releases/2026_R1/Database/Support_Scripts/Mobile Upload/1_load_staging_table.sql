SET SERVEROUTPUT ON SIZE UNLIMITED;
DECLARE
        gc_files_dir VARCHAR2(20) := 'MPCFILES';

        lv_status VARCHAR2(20000) := NULL;


    PROCEDURE insert_staging_table( p_upload_id IN VARCHAR2, 
                                    p_session_id IN VARCHAR2,
                                    p_file_name IN VARCHAR2,
                                    p_user_id   IN VARCHAR2,
                                    p_status    OUT VARCHAR2) IS
        l_file         UTL_FILE.file_type;
        l_text         VARCHAR2(32767);
        l_exists       BOOLEAN;
        l_file_length  NUMBER;
        l_blocksize    NUMBER;
        lv_data_string  VARCHAR2(32767);
        lv_encrypt_flag VARCHAR2(1);
        ln_line_counter NUMBER;
        lv_bare_filename VARCHAR2(200);
        lv_tableName VARCHAR2(100);
        lv_laptopID VARCHAR2(10);
        lv_file_ext VARCHAR2(10);


    BEGIN
        IF p_file_name IS NULL THEN
            p_status := 'ERROR: Filename is required';
            RETURN;            
        END IF;

        IF p_user_id IS NULL THEN
            p_status := 'ERROR: User ID is required';
            RETURN;                 
        END IF;

        IF p_upload_id IS NULL THEN
            p_status := 'ERROR: Upload ID is required';
            RETURN;
        END IF;

        UTL_FILE.fgetattr(gc_files_dir, p_file_name, l_exists, l_file_length, l_blocksize);
        p_status := 'OK';

        IF NOT l_exists THEN
          p_status := 'ERROR: File not found';
          RETURN;
        END IF;

        lv_tableName := SUBSTR(p_file_name, 0, INSTR(p_file_name,'-')-1);
        lv_laptopID := SUBSTR(p_upload_id, 0, INSTR(p_upload_id, '_')-1);
        lv_file_ext := SUBSTR(p_file_name, -3);
        IF lv_file_ext = 'dat' THEN
            lv_encrypt_flag := '1';
        ELSIF lv_file_ext = 'txt' THEN
            lv_encrypt_flag := '0';
        ELSIF lv_file_ext = 'hdr' THEN -- header file is not encrypted
            lv_encrypt_flag := '0';            
        END IF;

        -- Open file.
        l_file := UTL_FILE.fopen(gc_files_dir, p_file_name, 'r', 32767);
        ln_line_counter := 0;
        -- Read through the file until we reach the last line.
        BEGIN
            LOOP
                UTL_FILE.get_line(l_file, l_text, 32767);

                IF l_text IS NOT NULL THEN

                    l_text := REPLACE(REPLACE(l_text, CHR(13), ' '), CHR(10), ' ')  ;
                    lv_data_string := TRIM(l_text);
                    ln_line_counter := ln_line_counter + 1;

                    IF lv_encrypt_flag NOT IN ('0', '1') THEN
                        p_status := 'ERROR: Invalid data - Encryption flag not found';   
                        EXIT;
                    END IF;

                    INSERT INTO lt_laptop_staging (
                        data_string,
                        file_name,
                        decrypt_flag,
                        table_name,
                        laptop_id,
                        insert_date,
                        insert_user,
                        upload_id,
                        session_id
                    ) VALUES (
                        lv_data_string,
                        p_file_name,
                        lv_encrypt_flag,
                        lv_tablename,
                        lv_laptopid,
                        sysdate,
                        p_user_id,
                        p_upload_id,
                        p_session_id
                    );
                END IF;
            END LOOP;

        EXCEPTION
            WHEN NO_DATA_FOUND THEN
              NULL;
            WHEN OTHERS THEN
              p_status := 'ERR: ' || p_file_name || ' - ' || SUBSTR(sqlerrm, 1, 900);
              dbms_output.put_line(p_status);
        END;        
        -- Close the file.
        UTL_FILE.fclose(l_file);

    END insert_staging_table;  
BEGIN
    insert_staging_table('102_030725143524_IBC', '20250311', 'donation_interdictions-102_030725143524_IBC.dat', 'ASHVAR', lv_status);

    DBMS_OUTPUT.PUT_LINE('STATUS ' || lv_status);
END;

