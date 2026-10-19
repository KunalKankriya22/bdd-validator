SET SERVEROUTPUT ON;
DECLARE
    LV_STATUS VARCHAR2(2000);
   PROCEDURE process_data_string(p_upload_id IN VARCHAR2,
                                 p_status    OUT VARCHAR2) IS
     l_decrypt_str VARCHAR2(4000) := NULL;
     l_sep         valid_parameters.parameter_value%TYPE := NULL;
     n          NUMBER;
     l_data_str VARCHAR2(4000);
     lc_pgm_id  VARCHAR2(50) := 'PROCESS_DATA_STRING';

     CURSOR data_string_cur IS
       SELECT data_string, decrypt_data_string, decrypt_flag
         FROM lt_laptop_staging
        WHERE nvl(process_flag, 'N') not in ('P', 'C', 'E')
          AND upload_id = p_upload_id
          FOR UPDATE OF decrypt_data_string; -- 'P' : Processed; 'C' : Completed; 'E' : Error

     PROCEDURE DECRYPT_STRING(l_enc_str_in  IN VARCHAR2,
                              l_dec_str_out OUT VARCHAR2) IS
       t_temp_str    VARCHAR2(4000);
       t_decrypt_str VARCHAR2(4000);
       t_len         number;
       t_new_len     number;
       t_char        VARCHAR2(1);
     BEGIN
       t_temp_str    := l_enc_str_in;
       t_len         := length(l_enc_str_in);
       t_decrypt_str := null;
       for i in 1 .. t_len loop
         t_char        := substr(t_temp_str, 1, 1);
         t_new_len     := t_len - i;
         t_temp_str    := substr(t_temp_str, (-1) * t_new_len);
         t_decrypt_str := t_decrypt_str || chr(127 - ascii(t_char));
       end loop;
       l_dec_str_out := t_decrypt_str;
     EXCEPTION
       WHEN OTHERS THEN
         l_dec_str_out := NULL;
     END;

   BEGIN
     p_status := 'OK';

     -- Get Seperator Value
     BEGIN
       SELECT parameter_value
         INTO l_sep
         FROM valid_parameters
        WHERE parameter_code = 'EXTDLT'
          AND ROWNUM < 2;
     EXCEPTION
       WHEN no_data_found then
         p_status := 'ERR: Parameter value is not found in valid parameters table for code - EXTDLT';
         RETURN;
       WHEN others then
         p_status := SUBSTR(SQLERRM, 1, 1000);
         RETURN;
     END;

     -- Get Data strings from lt_laptop_staging table
     n := 0;
     FOR Z1 in data_string_cur LOOP
       n := n + 1;
       BEGIN
         IF nvl(Z1.decrypt_flag, 'X') NOT IN ('1', '0') THEN
           p_status := 'ERR: Decrypt flag not found in data string';
           RETURN;
         END IF;

         IF nvl(Z1.decrypt_flag, 'X') IN ('1', '0') THEN
           IF nvl(z1.decrypt_flag, 'X') = '1' THEN
             l_data_str := utl_raw.cast_to_varchar2(hextoraw(Z1.data_string));
             decrypt_string(l_data_str, l_decrypt_str);
             IF l_decrypt_str IS NULL THEN
               p_status := 'ERR: Unable to decrypt string.';
               RETURN;
             END IF;
           ELSE
             l_decrypt_str := Z1.data_string;
           END IF;


           UPDATE lt_laptop_staging
              SET decrypt_data_string = l_decrypt_str,
                  process_flag        = 'P'
            WHERE CURRENT OF data_string_cur;
         END IF;
       END;
     END LOOP;
     COMMIT;
   EXCEPTION
     WHEN others THEN
       p_status     := substr(sqlerrm, 1, 1000);
       RETURN;
   END process_data_string;
BEGIN
    process_data_string('102_030725143524_IBC', LV_STATUS);
    DBMS_OUTPUT.PUT_LINE(LV_STATUS);
END;