DECLARE
   CURSOR cur_dsi IS
      SELECT drive_id, chapter_id, campaign_id, event_id,
             schedule_id, drv_leave_time, drv_return_time, drv_travel_time,
             drv_setup_time, estimated_cpu, actual_cpu, projected_show,
             projected_draw, signoff_date, signoff_user_id, rowid
        FROM mw_drive_statistical_info
      ORDER BY chapter_id, drive_id;
---
   t_sponsor_id                  varchar2(10);
   t_proj_draw                   number;
   t_proj_show                   number;
   t_act_travel                  date;
   t_sch_travel                  date;
   t_act_setup                   date;
   t_sch_setup                   date;
   t_act_leave                   date;
   t_act_return                  date;
   t_drive_date                  date;
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
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_drive_statistical_info');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec IN cur_dsi LOOP
      b_rec_status := TRUE;
---
---   Verify that required fields are present.
---
      BEGIN
         IF (currec.drive_id is null) THEN
             dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                                  currec.rowid||' DRIVE_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (currec.chapter_id is null) THEN
             dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                                  currec.rowid||' CHAPTER_ID is null');
             b_rec_status := FALSE;
         END IF;
      END;
---
---  Verify that drive exists in DRIVES table.
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
          dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                               currec.rowid||' DRIVE not present');
          b_rec_status := FALSE;
      END IF;
---
---  If campaign ID not null, verify that campaign is valid.
---
      IF (currec.campaign_id is not null) THEN
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM campaigns
             WHERE campaign_id = currec.campaign_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                                  currec.rowid||' Campaign not present');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
---  If Event ID not null, verify that event is valid.
---
      IF (currec.event_id is not null) THEN
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM community_events
             WHERE event_id = currec.event_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                                  currec.rowid||' Event not present');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
---  If schedule ID not null, verify that schedule is valid.
---
      IF (currec.event_id is not null) THEN
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM staff_schedule_hdr
             WHERE schedule_id = currec.schedule_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_DRIVE_STATISTICAL_INFO'||' '||
                                  currec.rowid||' schedule ID not present');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
      IF (b_rec_status = TRUE) THEN
---
---   verify drive_sponsors record
---
         t_sponsor_id := null;
         BEGIN
            SELECT sponsor_id
              INTO t_sponsor_id
              FROM drive_sponsors
             WHERE drive_sponsors.drive_id = currec.drive_id
               AND sponsor_id in
                   (SELECT sponsor_id FROM sponsors
                     WHERE default_location_id =
                           (SELECT location_id FROM drives
                             WHERE drives.drive_id = currec.drive_id))
               AND rownum < 2;
         EXCEPTION
            WHEN no_data_found THEN
               t_sponsor_id := null;
         END;
---
---   insert stats into drive sponsors.
---
         IF (t_sponsor_id is not null) THEN
            UPDATE drive_sponsors
               SET projected_show = currec.projected_show,
                   projected_draw = currec.projected_draw
             WHERE drive_sponsors.drive_id = currec.drive_id
               AND drive_sponsors.sponsor_id = t_sponsor_id
               AND drive_sponsors.chapter_id = currec.chapter_id;
         END IF;
---
---   verify that drives has correct draw stats.
---
         BEGIN
            SELECT projected_show, projected_draw
              INTO t_proj_show, t_proj_draw
              FROM drives
             WHERE drives.drive_id = currec.drive_id;
         EXCEPTION
            WHEN no_data_found THEN
               t_proj_show := 0;
               t_proj_draw := 0;
         END;
---
---   If not, then update drives
---
         IF ((t_proj_show != currec.projected_show) OR
             (t_proj_draw != currec.projected_draw)) THEN
            UPDATE drives
               SET drives.projected_show = currec.projected_show,
                     drives.projected_draw = currec.projected_draw
             WHERE drives.drive_id = currec.drive_id
               AND drives.chapter_id = currec.chapter_id;
         END IF;
---
---   Calculate all other information, and update drive.
---
         t_act_travel := null;
         t_sch_travel := null;
         t_act_setup  := null;
         t_sch_setup  := null;
         t_act_leave  := null;
         t_act_return := null;
---
         BEGIN
            SELECT to_date(to_char(drive_date,'MM-DD-YYYY')||' '||
                   to_char(currec.drv_leave_time,'HH24:MI'),
                   'MM-DD-YYYY HH24:MI'),
                   to_date(to_char(drive_date,'MM-DD-YYYY')||' '||
                   to_char(currec.drv_return_time, 'HH24:MI'), 
                   'MM-DD-YYYY HH24:MI'), drive_date
               INTO t_act_leave, t_act_return, t_drive_date
               FROM drives
               WHERE drives.drive_id = currec.drive_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               t_act_leave  := null;
               t_act_return := null;
         END;
---
         IF (currec.drv_leave_time is null) THEN
            t_act_leave  := null;
         END IF;
---
         IF (currec.drv_return_time is null) THEN
            t_act_return := null;
         END IF;
---
         t_act_setup  := null;
         t_act_travel := null;
---
         IF (currec.drv_setup_time is not null) THEN
            t_sch_setup := currec.drv_setup_time;
         ELSE
            t_sch_setup  := null;
         END IF;
---
         IF (currec.drv_setup_time is not null) THEN
            t_sch_travel := currec.drv_setup_time;
         ELSE
            t_sch_travel  := null;
         END IF;
---
         IF (t_drive_date < sysdate) THEN
            t_act_setup := t_sch_setup;
            t_act_travel := t_sch_travel;
         END IF;
---
         BEGIN
            UPDATE drives
               SET campaign_id = nvl(currec.campaign_id,drives.campaign_id),
                   event_id = nvl(currec.event_id, drives.event_id),
                   schedule_id = nvl(currec.schedule_id,drives.schedule_id),
                   estimated_cpu = nvl(currec.estimated_cpu,
                                       drives.estimated_cpu),
                   actual_cpu = nvl(currec.actual_cpu, drives.actual_cpu),
                   actual_leave_time = nvl(t_act_leave, actual_leave_time),
                   actual_return_time = nvl(t_act_return, actual_return_time),
---                actual_travel_time = nvl(t_act_travel,
---                                         drives.actual_travel_time),
---                sch_travel_time = nvl(t_sch_travel, drives.sch_travel_time),
---                actual_stup_bkdown_time = nvl(t_act_setup,
---                                           drives.actual_stup_bkdown_time),
---                schedule_stup_bkdown_time = nvl(t_sch_setup,
---                                           drives.schedule_stup_bkdown_time),
                   signoff_user = nvl(currec.signoff_user_id,
                                             drives.signoff_user),
                   signoff_date = nvl(currec.signoff_date,
                                             drives.signoff_date)
             WHERE drives.chapter_id = currec.chapter_id
               AND drives.drive_id = currec.drive_id;
         EXCEPTION
            WHEN OTHERS THEN
                 dbms_output.put_line('Error Occured in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END;
---
---   Commit Processing
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
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Drive stat Info : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Drive stat Info : Stopped!');
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
