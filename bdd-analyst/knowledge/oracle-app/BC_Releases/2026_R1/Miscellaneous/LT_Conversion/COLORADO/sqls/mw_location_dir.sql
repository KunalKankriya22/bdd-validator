DECLARE
   CURSOR CUR_L is
      SELECT location_id, chapter_id, directions,rownum 
        FROM mw_LOCATION_dir
      ORDER BY chapter_id, location_id;
---
   i_count          number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   b_recs_commited  boolean;
   b_run_status     boolean;
   v_date_time      varchar2(20);
   b_rec_status     boolean;
   v_program_id     VARCHAR2(8);
   i_commit_recs    number;
   v_insert_user    VARCHAR2(6);
   i_audit_key      number;
   t_address_id     VARCHAR2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '4315C';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM-DD-YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_location');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
---    STEP 1: Check that required fields are not null, else log the record
---
   FOR currec IN cur_l LOOP
      b_rec_status := TRUE;
      IF (currec.location_id is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' location_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.directions is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' directions is null');
          b_rec_status := FALSE;
      END IF;
---
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            update locations set site_directions=currec.directions
             where location_id=currec.location_id ;
---
---    Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (mod(i_rec_count, i_commit_recs) = 0) THEN
               b_recs_commited := TRUE;
               commit;
            END IF;
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Error Occured in Step 4!'||
                       to_char(sqlerrm));
         END;
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Locations locations: Done!!');
   ELSE
        dbms_output.put_line('Conversion for Locations : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM-DD-YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('No. of records converted    : '||
                         to_char(i_recs_succ));
   dbms_output.put_line('No. of records not converted : '||
                         to_char(i_recs_fail));
   dbms_output.put_line('Script End Time : '||v_date_time);
   commit;
END; 
/
