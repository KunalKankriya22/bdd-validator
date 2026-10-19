DECLARE
   header_text        varchar2(128);
   page_count         number(3);
   line_count         number(3);
---
   log_dir                 VARCHAR2(50);
   log_file                VARCHAR2(100);
   g_log_handle            utl_file.file_type;
   g_inst_name             VARCHAR2(4);
   g_chapter_id            VARCHAR2(4);
   g_program_id            VARCHAR2(30);
   g_version_no            VARCHAR2(10);
---
   days_back_for_hold  number(2);
   out_status          varchar2(375);
   out_insert_date     date;
---
   CURSOR get_units_to_interdict IS
      SELECT donor_id, unit_id, coll_date, chapter_id, transaction_id
        FROM donations don
       WHERE coll_date between trunc(sysdate)-days_back_for_hold-7 AND
                               trunc(sysdate)-days_back_for_hold
         AND n_audit_flag is null
         AND unit_id is not null
         AND donor_id is not null
         AND NOT EXISTS
             (SELECT 'Already interdicted'
                FROM donor_interdictions di
               WHERE di.donor_id = don.donor_id
                 AND di.unit_id = don.unit_id
                 AND di.inter_code = 'RAPND');
---
   CURSOR get_units_to_release IS
      SELECT don.donor_id, don.unit_id, don.coll_date, don.chapter_id, 
             don.transaction_id, di.eff_date, di.originated_from,
             di.reason_code
        FROM donations don, donor_interdictions di
       WHERE don.n_audit_flag is not null
         AND don.unit_id is not null
         AND (don.donor_id, don.unit_id) IN
             (SELECT di.donor_id, di.unit_id
                FROM donor_interdictions di
               WHERE di.inter_code = 'RAPND'
                 AND di.release_date is null)
         AND di.inter_code = 'RAPND'
         AND di.release_date is null
         AND di.transaction_id = don.transaction_id;
---
BEGIN
   dbms_output.enable(500000);
---
   g_chapter_id := 'ALL';
   g_program_id := 'PLACE_RAPND';
   g_version_no := '02';
---
---   Load instance name into g_inst_name.
---
   BEGIN
      SELECT decode(instr(global_name,'.'),
                    0,rtrim(ltrim(substr(global_name,1,4))),
                    rtrim(ltrim(substr(global_name,1,
                    least(instr(global_name,'.')-1,4)))))
        INTO g_inst_name
        FROM global_name;
   EXCEPTION
      WHEN others THEN
         DBMS_OUTPUT.put_line('Error initializing g_inst_name');
         RAISE;
   END;
---
---  Get directory location to place interface log files in.
---
   BEGIN
      SELECT parameter_value
        INTO log_dir
        FROM valid_parameters
       WHERE parameter_code = 'ILOG'
         AND chapter_id = g_chapter_id
         AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate+1);
   EXCEPTION
      WHEN others THEN
         dbms_output.put_line('Error in SQL:'||sqlcode||
                              substr(sqlerrm,1,100));
         RAISE;
   END;
---
---  Load number of days back to run interface for
---
   BEGIN
      SELECT to_number(parameter_value)
        INTO days_back_for_hold
        FROM valid_parameters
       WHERE parameter_code = 'DAYS_RAPND'
         AND sysdate between eff_date and nvl(term_date, sysdate+1);
   EXCEPTION
      WHEN others THEN
         days_back_for_hold := 14;
   END;
---
---  Build log file name, and open file.
---
   BEGIN
      log_file := 'RAPND_'||to_char(sysdate,'MMDDYYYYHH24MI')||
                  '_'||g_inst_name||'.log';
      g_log_handle := utl_file.fopen(log_dir,log_file,'w');
   EXCEPTION
      WHEN utl_file.invalid_path THEN
         dbms_output.put_line('Invalid path or filename');
         RAISE;
      WHEN others THEN
         dbms_output.put_line('Error in prepare_log_filename');
         RAISE;
   END;
---
   line_count := '1';
   page_count := '1';
   header_text := 'Program: '||rpad(substr(g_program_id,1,21),21)||
                  'Version: '||rpad(substr(g_version_no,1,21),21)||
                  'Database: '||rpad(substr(g_inst_name,1,18),18)||
                  'Timestamp: '||
                  ltrim(rtrim(to_char(sysdate,'MM-DD-YYYY HH24:MI:SS')));
---
   FOR c1 in get_units_to_interdict LOOP
---
      IF (line_count = 1) THEN
         utl_file.put_line (g_log_handle,header_text||'    Page: '||
                            rtrim(ltrim(to_char(page_count,'99'))));
         utl_file.put_line (g_log_handle,
                            '========================================'||
                            '========================================'||
                            '========================================'||
                            '============');
         utl_file.put_line (g_log_handle,
                            'Automatic interdiction of donors where the '||
                            'Nursing Audit has not been performed.');
         utl_file.put_line (g_log_handle,'');
         utl_file.fflush(g_log_handle);
         line_count := 6;
      END IF;
---
      don_inter.inter_upgrade_place
          (c1.donor_id, 'ALL', c1.unit_id, c1.transaction_id, 
           'RAPND', null, null, 'DONSYS', null, null, 'AUTO_INTER',
           c1.coll_date, null, null, out_status);
---
      IF (rtrim(ltrim(out_status))='OK') THEN
         out_status := 'RAPND successfully placed on donor: '||c1.donor_id;
      END IF;
---
      utl_file.put_line (g_log_handle,
                         'Unit: '||substr(c1.unit_id,1,8)||
                         '  Coll Date: '||to_char(c1.coll_date, 'MM-DD-YY')||
                         '  Interdiction Status: '||substr(out_status,1,75));
      COMMIT;
      utl_file.fflush(g_log_handle);
      line_count := line_count + 1;
---
      IF (line_count > 60) THEN
         line_count := 1;
         page_count := page_count + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   FOR b1 IN line_count..61 LOOP
      utl_file.put_line (g_log_handle,'');
      utl_file.fflush(g_log_handle);
   END LOOP;
---
   page_count := page_count + 1;
   line_count := 1;
---
   FOR c2 in get_units_to_release LOOP
       out_insert_date := null;
---
      IF (line_count = 1) THEN
         utl_file.put_line (g_log_handle,header_text||'    Page: '||
                            rtrim(ltrim(to_char(page_count,'99'))));
         utl_file.put_line (g_log_handle,
                            '========================================'||
                            '========================================'||
                            '========================================'||
                            '============');
         utl_file.put_line (g_log_handle,
                            'Automatic RELEASE of RAPND where the '||
                            'Nursing Audit has been performed.');
         utl_file.put_line (g_log_handle,'');
         utl_file.fflush(g_log_handle);
         line_count := 6;
      END IF;
---
  --    don_inter.inter_upgrade_remove
  --       (c2.donor_id, 'ALL', c2.unit_id, c2.transaction_id, 
  --        'RAPND', c2.originated_from, c2.reason_code,
  --        'DONSYS', null, null, 'AUTO_REMOV', c2.eff_date, 
  --        out_insert_date, null, null, 'SYSTEM RELEASED', out_status);
---
      IF (rtrim(ltrim(out_status))='OK') THEN
         out_status := 'RAPND successfully removed from donor: '||c2.donor_id;
      END IF;
---
      utl_file.put_line (g_log_handle,
                         'Unit: '||substr(c2.unit_id,1,8)||
                         '  Coll Date: '||to_char(c2.coll_date, 'MM-DD-YY')||
                         '  Interdiction Status: '||substr(out_status,1,75));
      COMMIT;
      utl_file.fflush(g_log_handle);
      line_count := line_count + 1;
---
      IF (line_count > 60) THEN
         line_count := 1;
         page_count := page_count + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   utl_file.fflush(g_log_handle);
   utl_file.fclose(g_log_handle);
END;
/
exit;

