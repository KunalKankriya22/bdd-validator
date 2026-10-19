DECLARE
   CURSOR CUR_RDBT is
      SELECT unit_id, coll_date, chapter_id, arm, seq, start_time,
             phleb_id_s, end_time, phleb_id_r, rowid
        FROM mw_donation_btime_info
----WHERE unit_id > ' L65799'
      ORDER BY unit_id, arm, seq;
---
   i_count               number;
   i_count1              number;
   i_rec_count           number;
   i_recs_succ           number;
   i_recs_fail           number;
   b_recs_commited       boolean;
   b_run_status          boolean;
   v_date_time           varchar2(20);
   b_rec_status          boolean;
   v_program_id          VARCHAR2(8);
   i_commit_recs         number;
   v_insert_user         VARCHAR2(6);
   i_audit_key           number;
   t_donor_id            VARCHAR2(10);
   t_start_bleed_time    date;
   t_end_bleed_time      date;
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := 'CONVERT';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donation_btime_info');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in CUR_RDBT LOOP
      b_rec_status := TRUE;
      IF (currec.unit_id is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' UNIT_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.coll_date is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' coll_date is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.arm is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' arm is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.seq is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' seq is null');
          b_rec_status := FALSE;
      END IF;
---
---   IF (currec.start_time is null) THEN
---       dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
---                            currec.rowid||' start_time is null');
---       b_rec_status := FALSE;
---   END IF;
---
      IF (currec.end_time is null) THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' end_time is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (b_rec_status = TRUE) THEN
---
---  Verify that donation record is in DONATIONS table.
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM donations
             WHERE unit_id = currec.unit_id
               AND chapter_id = currec.chapter_id
               AND coll_date = currec.coll_date;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                                  currec.rowid||' DONATION not present');
             b_rec_status := FALSE;
         END IF;
---
---    Check start phlebotomist ID
/* ---
         IF (currec.phleb_id_s is not null) THEN
            i_count := 0;
            BEGIN
               SELECT count(*)
                 INTO i_count
                 FROM employees
                WHERE employees.staff_no = currec.phleb_id_s
                  AND employees.emp_class in ('MSTAF','FSTAF')
                  AND sysdate between eff_date and nvl(term_date, sysdate+1);
            EXCEPTION
               WHEN others THEN
               i_count := 0;
            END;
---
            IF (i_count = 0) THEN
                dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                                     currec.rowid||' Invalid Start Phleb ID');
                b_rec_status := FALSE;
            END IF;
         END IF;
---
---    Check END phlebotomist ID
---
         IF (currec.phleb_id_s is not null) THEN
            i_count := 0;
            BEGIN
               SELECT count(*)
                 INTO i_count
                 FROM employees
                WHERE employees.staff_no = currec.phleb_id_r
                  AND employees.emp_class in ('MSTAF','FSTAF')
                  AND sysdate between eff_date and nvl(term_date, sysdate+1);
            EXCEPTION
               WHEN others THEN
               i_count := 0;
            END;
---
            IF (i_count = 0) THEN
                dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                                     currec.rowid||' Invalid End Phleb ID');
                b_rec_status := FALSE;
            END IF;
         END IF;
 -- */

      END IF;

---  
---    Check ARM
---
      IF NOT (currec.arm = 'L' or currec.arm = 'R') THEN
          dbms_output.put_line('MW_DONATION_BTIME_INFO'||' '||
                               currec.rowid||' Invalid Arm');
          b_rec_status := FALSE;
      END IF;
---
---   Update appropriate columns of the Donations table.
---
      t_start_bleed_time := null;
      t_end_bleed_time := null;
      IF (b_rec_status = TRUE) THEN
         t_start_bleed_time := null;
---      t_start_bleed_time := to_date(rtrim(ltrim(to_char
---                            (currec.coll_date,'MM-DD-YYYY')))||' '||
---                            rtrim(ltrim(to_char(currec.start_time,
---                            'HH24:MI'))), 'MM-DD-YYYY HH24:MI');
---
         IF (currec.end_time is not null) THEN
            t_end_bleed_time := to_date(rtrim(ltrim(to_char
                                (currec.coll_date,'MM-DD-YYYY')))||' '||
                                rtrim(ltrim(to_char(currec.end_time,
                                'HH24:MI'))), 'MM-DD-YYYY HH24:MI');
         END IF;
---
         BEGIN
            UPDATE donations
               SET bleed_start_time_l1 =  decode(currec.arm, 'L', 
                                             decode(currec.seq,'1', 
                                                currec.start_time, 
                                                bleed_start_time_l1),
                                                bleed_start_time_l1),
                   bleed_start_time_r1 =  decode(currec.arm, 'R',
                                             decode(currec.seq,'1', 
                                                currec.start_time, 
                                                bleed_start_time_r1), 
                                                bleed_start_time_r1),
                   bleed_start_time_l2 =  decode(currec.arm, 'L', 
                                             decode(currec.seq,'2', 
                                                currec.start_time, 
                                                bleed_start_time_l2),  
                                                bleed_start_time_l2),
                   bleed_start_time_r2 =  decode(currec.arm, 'R', 
                                             decode(currec.seq,'2', 
                                                currec.start_time, 
                                                bleed_start_time_r2),  
                                                bleed_start_time_r2),
                   bleed_end_time_l =     decode(currec.arm, 'L', 
                                             decode(currec.seq,'1', 
                                                currec.end_time,   
                                                bleed_end_time_l),     
                                                bleed_end_time_l),
                   bleed_end_time_r =     decode(currec.arm, 'R', 
                                             decode(currec.seq,'1', 
                                                currec.end_time,   
                                                bleed_end_time_r),     
                                                bleed_end_time_r),
                   bleed_end_time_l2 =    decode(currec.arm, 'L', 
                                             decode(currec.seq,'2', 
                                                currec.end_time,   
                                                bleed_end_time_l2),    
                                                bleed_end_time_l2),
                   bleed_end_time_r2 =    decode(currec.arm, 'R', 
                                             decode(currec.seq,'2', 
                                                currec.end_time,   
                                                bleed_end_time_r2),    
                                                bleed_end_time_r2),
                   bleed_start_phleb_l1 = decode(currec.arm, 'L', 
                                             decode(currec.seq,'1', 
                                                '9999', --currec.phleb_id_s, 
                                                bleed_start_phleb_l1), 
                                                bleed_start_phleb_l1),
                   bleed_start_phleb_r1 = decode(currec.arm, 'R', 
                                             decode(currec.seq,'1', 
                                                '9999', --currec.phleb_id_s, 
                                                bleed_start_phleb_r1), 
                                                bleed_start_phleb_r1),
                   bleed_start_phleb_l2 = decode(currec.arm, 'L', 
                                             decode(currec.seq,'2', 
                                                '9999', --currec.phleb_id_s, 
                                                bleed_start_phleb_l2), 
                                                bleed_start_phleb_l2),
                   bleed_start_phleb_r2 = decode(currec.arm, 'R', 
                                             decode(currec.seq,'2', 
                                                '9999', --currec.phleb_id_s, 
                                                bleed_start_phleb_r2), 
                                                bleed_start_phleb_r2),
                   bleed_end_phleb_l =    decode(currec.arm, 'L', 
                                             decode(currec.seq,'1', 
                                                '9999', --currec.phleb_id_r, 
                                                bleed_end_phleb_l),    
                                                bleed_end_phleb_l),
                   bleed_end_phleb_r =    decode(currec.arm, 'R', 
                                             decode(currec.seq,'1',
                                                '9999', ---currec.phleb_id_r, 
                                                bleed_end_phleb_r),    
                                                bleed_end_phleb_r),
                   bleed_end_phleb_l2 =   decode(currec.arm, 'L',
                                             decode(currec.seq,'2', 
                                                '9999', --currec.phleb_id_r, 
                                                bleed_end_phleb_l2),   
                                                bleed_end_phleb_l2),
                   bleed_end_phleb_r2 =   decode(currec.arm, 'R', 
                                             decode(currec.seq,'2', 
                                                '9999', --currec.phleb_id_r, 
                                                bleed_end_phleb_r2),   
                                                bleed_end_phleb_r2)
             WHERE unit_id = currec.unit_id
               AND coll_date = currec.coll_date
               AND chapter_id = currec.chapter_id;
---
---    Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (mod(i_rec_count,i_commit_recs) = 0) THEN
               COMMIT;
               b_recs_commited := TRUE;
            END IF;
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Error Occurred in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Donation BTIME Info : Done!!');
   ELSE
      dbms_output.put_line('Conversion for Donation BTIME Info : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('Script End Time : '||v_date_time);
END; 
/
