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
  g_local_date             DATE;
  p_local_chapter          varchar2(4);

---
   interdict_flag      varchar2(1);
   days_back_for_hold  number(2);
   out_status          varchar2(375);

CURSOR chap_cur is select chapter_id from chapters where term_date is null;

---
   CURSOR get_units_to_interdict IS
      SELECT donor_id, unit_id, coll_date, chapter_id, transaction_id
        FROM donations don
       WHERE coll_date between trunc(g_local_date)-(days_back_for_hold+14) AND
                               trunc(g_local_date)-days_back_for_hold
         AND unit_id is not null
         and chapter_id=p_local_chapter
         AND NOT EXISTS
             (SELECT 'Already interdicted'
                FROM donor_interdictions di
               WHERE di.donor_id = don.donor_id
                 AND di.unit_id = don.unit_id
                 AND di.inter_code = 'TRPH')
         AND EXISTS
             (SELECT 'Required Profile test'
                FROM contract_tests lct
               WHERE lct.contract_id = 'INTERNAL'
                 AND lct.chapter_id = don.chapter_id
                 AND nvl(lct.stop_label_flag, 'N') = 'Y'
                 AND don.coll_date between lct.eff_date and 
                                           nvl(lct.term_date, sysdate+1)
                 AND NOT EXISTS
                     (SELECT 'Test in Unit_test_results'
                        FROM unit_test_results utr
                       WHERE utr.unit_id = don.unit_id
                         AND utr.coll_date = don.coll_date
                         AND utr.chapter_id = don.chapter_id
                         AND utr.test_id = lct.test_id))
         AND EXISTS
             (SELECT 'Unit has a BIO interdiction on LAB'
                FROM unit_interdictions lui
               WHERE lui.unit_id = don.unit_id
                 AND lui.coll_date = don.coll_date
                 AND lui.chapter_id = don.chapter_id
                 AND lui.inter_code in
                     (SELECT lvi.inter_code 
                        FROM valid_interdictions_lab lvi
                       WHERE lvi.inter_type = 'B'
                         AND don.coll_date between lvi.eff_date and 
                                 nvl(lvi.term_date, don.coll_date+1)));
---
BEGIN
   dbms_output.enable(500000);
---
   g_chapter_id := 'ALL';
   g_program_id := 'PLACE_TRPH';
   g_version_no := '2012+';
  
---
---   Load instance name into g_inst_name.
---
FOR Z in chap_cur LOOP

 p_local_chapter:=Z.chapter_id;
 g_local_date:=lifetrack_timezone_convert.get_local_time(Z.chapter_id,sysdate);

dbms_output.put_line('Chapter='||p_local_chapter||'Date='||
                       to_char(g_local_date,'mm-dd-yyyy'));


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
       --  AND chapter_id = g_chapter_id    -- commented out for multi chapter reason , Edwin 12/27/13
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
       WHERE parameter_code = 'DAYS_TRPH'
    --  AND chapter_id = 'WAD'  -- commented out for multi chapter reason , Edwin 12/27/13
         AND rownum=1
         AND sysdate between eff_date and nvl(term_date, sysdate+1);
   EXCEPTION
      WHEN others THEN
         days_back_for_hold := 14;
   END;
---
---  Build log file name, and open file.
---
   BEGIN
      log_file := 'PTRPH_'||to_char(sysdate,'MMDDYYYYHH24MI')||
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
                            'Interdiction of units with Profile Testing '||
                            'Interface Not Done: ');
         utl_file.put_line (g_log_handle,'');
         utl_file.fflush(g_log_handle);
         line_count := 6;
      END IF;
---
      interdict_flag := 'Y';
      BEGIN
         SELECT 'N' 
           INTO interdict_flag 
           FROM donations
          WHERE unit_id = c1.unit_id
            AND coll_date = c1.coll_date
            AND chapter_id = c1.chapter_id
            AND donation_type = 'TH';
      EXCEPTION
         WHEN no_data_found THEN
              null;
      END;
---
      BEGIN
         SELECT 'N' 
           INTO interdict_flag 
           FROM donation_attributes 
          WHERE attrib_code = 'VENI'
            AND attrib_value in ('03','04','05')
            AND transaction_id = c1.transaction_id;
      EXCEPTION
         WHEN no_data_found THEN
              null;
         WHEN too_many_rows THEN
              interdict_flag := 'N';
      END;
---
      IF (interdict_flag = 'Y') THEN
         don_inter.inter_upgrade_place
             (c1.donor_id, g_chapter_id, c1.unit_id, c1.transaction_id,
              'TRPH', null, null, 'DONSYS', null, null, 'TRPH_SH', 
              c1.coll_date, null, null, out_status);
---
         IF (rtrim(ltrim(out_status))='OK') THEN
            out_status := 'TRPH successfully placed on donor: '||c1.donor_id;
          ELSE
           dbms_output.put_line('Message:'||out_status);

         END IF;
---
         utl_file.put_line (g_log_handle,
                            'Unit: '||c1.unit_id||
                            '  Coll Date: '||to_char(c1.coll_date, 'MM-DD-YY')||
                            '  Interdiction Status: '||substr(out_status,1,75));
         COMMIT;
         utl_file.fflush(g_log_handle);
         line_count := line_count + 1;
      END IF;
---
      IF (line_count > 60) THEN
         line_count := 1;
         page_count := page_count + 1;
      END IF;
   END LOOP;
   utl_file.fflush(g_log_handle);
   utl_file.fclose(g_log_handle);

END LOOP;      --- for chapter cursor
END;
/
EXIT
