DECLARE
   CURSOR CUR_DS is
      SELECT DRIVE_ID, CHAPTER_ID, SPONSOR_ID, PROJECTED_SHOW,
             PROJECTED_DRAW, CONTACT_ID, PROJ_DEFER_RATE, ROWID
        FROM mw_drive_sponsors
       ORDER BY chapter_id, sponsor_id, drive_id;
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
   t_donor_id       VARCHAR2(10);
   t_address_id     VARCHAR2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '4313';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   t_address_id     := null;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_drive_sponsors');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec IN cur_ds LOOP
      b_rec_status := TRUE;
---
      IF (currec.sponsor_id is null) THEN
          dbms_output.put_line('MW_DRIVE_SPONSOR'||' '||
                               currec.rowid||' sponsor_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DRIVE_SPONSOR'||' '||
                               currec.rowid||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.drive_id is null) THEN
          dbms_output.put_line('MW_DRIVE_SPONSOR'||' '||
                               currec.rowid||' DRIVE_ID is null');
          b_rec_status := FALSE;
      END IF;
---
---  Verify that Sponsor already exists by sponsor ID and chapter ID
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM sponsors
             WHERE sponsor_id = currec.sponsor_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 <= 0) THEN
             dbms_output.put_line('MW_DRIVE_SPONSORS '||
                                 currec.rowid||' Sponsor ID NOT defined');
             b_rec_status := FALSE;
         END IF;
---
---   Verify that drive is already defined
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM drives
             WHERE drive_id = currec.drive_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_DRIVE_SPONSORS '||
                                  currec.rowid||' DRIVE not defined');
             b_rec_status := FALSE;
         END IF;
---
---    Insert record in drive_sponsors table
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO drive_sponsors
               (DRIVE_ID, CHAPTER_ID, SPONSOR_ID, PROJECTED_SHOW,
                PROJECTED_DRAW, CONTACT_ID, PROJ_DEFERRAL_RATE,
                PROGRAM_ID,INSERT_DATE, INSERT_USER, AUDIT_KEY)
            VALUES
               (currec.drive_id, currec.chapter_id, currec.sponsor_id,
                currec.projected_show, currec.projected_draw,
                currec.contact_id, currec.proj_defer_rate,
                v_program_id, sysdate, v_insert_user, i_audit_key );
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Error occurred during insert'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END;
---
---    Commit Processing
---
         i_rec_count := i_rec_count + 1;
         i_recs_succ := i_recs_succ + 1;
         b_recs_commited := FALSE;
         IF (i_rec_count mod i_commit_recs = 0) THEN
            COMMIT;
            b_recs_commited := TRUE;
            i_rec_count :=0;
         END IF;
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
---
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Drive_Sponsors : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Drive_Sponsors : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('Script End Time : '||v_date_time);
END;
/
