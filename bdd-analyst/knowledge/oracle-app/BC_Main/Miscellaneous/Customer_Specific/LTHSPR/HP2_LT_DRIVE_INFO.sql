set serveroutput on
spool /tmp/hs2lt_drive_info
DECLARE
   CURSOR get_hp_drive IS
      SELECT drive_id, drive_date, drive_type,
        to_date(schedule_start_time,'DD-Mon-RR HH24:MI:SS') sched_start_time,
        to_date(schedule_end_time,'DD-Mon-RR HH24:MI:SS') sched_end_time,
             recruiter_id, location_id, status,
             projected_draw, round(projected_draw / .75) projected_show, 
             sponsor_id, sponsor_id_2, drive_category, 
             facility_code, open_to_public, rowid
        FROM hp_drive2 hp
       WHERE insert_date>= trunc(sysdate)-4
         AND (lt_read_date IS NULL OR lt_read_date < insert_date)
---
---   Added following because there are too many duplicate transactions
---
   AND NOT EXISTS
      (SELECT 'X'
         FROM drives dr2, drive_sponsors ds2,
              drive_facilities df2, valid_master_codes vmc,
              cbc_hemasphere_xref cbc
        WHERE dr2.drive_id = hp.drive_id
          AND dr2.drive_date = hp.drive_date
          AND dr2.location_id = hp.location_id
          AND to_date(hp.schedule_start_time,'DD-Mon-RR HH24:MI:SS') =
              dr2.schedule_start_time
          AND to_date(hp.schedule_end_time,'DD-Mon-RR HH24:MI:SS') =
              dr2.schedule_end_time
          AND dr2.drive_category = vmc.code
          AND dr2.drive_type = hp.drive_type
          AND dr2.status = hp.status
          AND dr2.projected_draw = hp.projected_draw
          AND nvl(replace(dr2.recruiter_id,'W',''),'XXX') = 
              trim(nvl(hp.recruiter_id,nvl(replace(dr2.recruiter_id,'W',''),
                 'XXX')))
          AND nvl(dr2.open_drive_ind,'X') =
              nvl(hp.open_to_public,nvl(dr2.open_drive_ind,'X'))
          AND dr2.drive_id = ds2.drive_id
          AND ds2.sponsor_id = hp.sponsor_id
          AND ds2.projected_draw = hp.projected_draw
          AND dr2.drive_id = df2.drive_id
          AND df2.facility_code = decode(hp.facility_code,'BBAF','BBAF',
                                'BBAA','BBAA','MOBIL','TYL',
                                hp.facility_code)
          AND vmc.code_type = 'DRCAT'
          AND vmc.code = cbc.cbc_code
          AND cbc.code_type = 'DRCAT'
          AND cbc.hemasphere_code = nvl(hp.drive_category,'xxxxx')
          AND sysdate BETWEEN vmc.eff_date
                          AND nvl(vmc.term_date,sysdate+1)
          AND sysdate BETWEEN cbc.eff_date
                          AND nvl(cbc.term_date,sysdate+1))
      ORDER BY drive_id, insert_date;
---
   t_count          NUMBER := 0;
   t_ins_cnt        NUMBER := 0;
   t_upd_cnt        NUMBER := 0;
   t_rej_cnt        NUMBER := 0;
   t_chk_flag       VARCHAR2(1);
   t_exist_flag     VARCHAR2(1);
   t_skip_flag      VARCHAR2(1);
   t_status         VARCHAR2(5);
   t_drv_cat        VARCHAR2(5);
   t_fac_code       VARCHAR2(5);
   t_cancel_date    DATE;
   t_cancel_user    VARCHAR2(6);
   t_cancel_reason  VARCHAR2(100);
   t_drive_hours    NUMBER;
   t_drive_type     VARCHAR2(5);
   t_number_reqd    NUMBER;
   t_staff_no       VARCHAR2(6);
---
BEGIN
   dbms_output.enable(1000000);
   dbms_output.put_line ('Start Daily Drive Interface '||
                         'Hemasphere to LifeTrak: '||
                         to_char(sysdate,'DY MM-DD-YYYY HH24:MI'));
   dbms_output.put_line ('===================================='||
                         '====================================');
   FOR a1 IN get_hp_drive LOOP
---
---   Validate sponsor
---
      t_drive_hours := trunc((a1.sched_end_time-a1.sched_start_time)*24);
      t_count := t_count + 1;
      t_skip_flag := 'N';
      t_chk_flag := 'N';
      BEGIN
         SELECT distinct 'Y'
           INTO t_chk_flag
           FROM sponsors
          WHERE sponsors.sponsor_id = a1.sponsor_id;
      EXCEPTION
         WHEN no_data_found THEN
            t_skip_flag := 'Y';
            dbms_output.put_line ('Skip Drive: '||a1.drive_id||
                                  ' Sponsor not on file: '||a1.sponsor_id);
         WHEN others THEN
            t_skip_flag := 'Y';
            dbms_output.put_line ('Skip Drive: '||a1.drive_id||
                                  ' SPONCHK '||substr(sqlerrm,1,50));
      END;
---
---   Validate location
---
      IF (t_skip_flag != 'Y') THEN
         t_chk_flag := 'N';
         BEGIN
            SELECT distinct 'Y'
              INTO t_chk_flag
              FROM locations
             WHERE locations.location_id = a1.location_id;
         EXCEPTION
            WHEN no_data_found THEN
               t_skip_flag := 'Y';
               dbms_output.put_line ('Skip Drive: '||a1.drive_id||
                                     ' Location not on file: '||a1.location_id);
            WHEN others THEN
               t_skip_flag := 'Y';
               dbms_output.put_line ('Skip Drive: '||a1.drive_id||
                                     ' LOCCHK '||substr(sqlerrm,1,50));
         END;
      END IF;
---
      IF (t_skip_flag != 'Y') THEN
         IF(a1.facility_code = 'BBAF') THEN
            t_fac_code := 'BBAF';
         ELSIF(a1.facility_code = 'BBAA') THEN
            t_fac_code := 'BBAA';
         ELSIF(a1.facility_code = 'MOBIL') THEN
            t_fac_code := 'TYL';
         ELSE
            t_fac_code := 'UNK';
         END IF;
---
         BEGIN
            SELECT distinct('Y')
              INTO t_chk_flag
              FROM valid_master_codes
             WHERE code_type = 'ZONE'
               AND code = t_fac_code
               AND sysdate BETWEEN eff_date AND nvl(term_date,sysdate+1);
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line ('Bad Facility, defaulted to BDF '||
                                     a1.drive_id||' '||a1.facility_code);
               t_fac_code := 'BDF';
         END;
---
         t_drv_cat := a1.drive_category;
         BEGIN
            SELECT vmc.code
              INTO t_drv_cat
              FROM valid_master_codes vmc, cbc_hemasphere_xref cbc
             WHERE vmc.code_type = 'DRCAT'
               AND vmc.code = cbc.cbc_code
               AND cbc.code_type = 'DRCAT'
               AND cbc.hemasphere_code = nvl(a1.drive_category,'xxxxx')
               AND sysdate BETWEEN vmc.eff_date
                               AND nvl(vmc.term_date,sysdate+1)
               AND sysdate BETWEEN cbc.eff_date
                               AND nvl(cbc.term_date,sysdate+1);
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line ('Bad category, defaulted to ROUTN '||
                                     a1.drive_id||' '||a1.drive_category);
               t_drv_cat := 'ROUTN';
         END;
---
         t_status := a1.status;
         IF (t_status NOT IN ('CNFRM','CANCL','HOLD')) THEN
            t_status := null;
         END IF;
---
         t_staff_no := null;
         BEGIN
            SELECT min(staff_no)
              INTO t_staff_no
              FROM employees emp
             WHERE a1.recruiter_id = replace(staff_no,'W','')
               AND emp.term_date IS NULL
               AND a1.recruiter_id IS NOT NULL;
         EXCEPTION
            WHEN others THEN
               t_staff_no := null;
         END;
---
         IF (t_status = 'CANCL') THEN
            t_cancel_date := sysdate;
            t_cancel_user := 'DONSYS';
            t_cancel_reason := 'Cancelled from Hemasphere';
         ELSE
            t_cancel_date := null;
            t_cancel_user := null;
            t_cancel_reason := null;
         END IF;
---
         t_drive_type := a1.drive_type;
         IF (t_drive_type NOT IN ('C','I','F')) THEN
            t_drive_type := null;
         END IF;
---
---   Check to see if drive exists
---
         t_chk_flag := 'N';
         BEGIN
            SELECT distinct('Y')
              INTO t_chk_flag
              FROM drives
             WHERE drives.drive_id = a1.drive_id;
         EXCEPTION
            WHEN no_data_found THEN
               t_chk_flag := 'N';
            WHEN others THEN
               dbms_output.put_line ('Unk err during DRVCHK: '||a1.drive_id||
                                     ' '||substr(sqlerrm,1,45));
               t_chk_flag := 'S';
         END;
---
         IF (t_chk_flag = 'Y') THEN
            t_upd_cnt := t_upd_cnt + 1;
            BEGIN
               UPDATE drives
                  SET drive_date = nvl(trunc(a1.drive_date),drive_date),
                      drive_type = nvl(t_drive_type,drive_type),
                      schedule_start_time = nvl(a1.sched_start_time,
                                            schedule_start_time),
                      schedule_end_time = nvl(a1.sched_end_time,
                                          schedule_end_time),
                      recruiter_id = nvl(t_staff_no,recruiter_id),
                      location_id = nvl(a1.location_id,location_id),
                      status = nvl(t_status,status),
---                   projected_show = nvl(a1.projected_show,projected_show),
---                   projected_draw = nvl(a1.projected_draw,projected_draw),
                      drive_category = nvl(t_drv_cat,drive_category),
                      open_drive_ind = nvl(a1.open_to_public,open_drive_ind),
                      last_modified_date = sysdate,
                      last_modified_user = 'DONSYS'
                WHERE drive_id = a1.drive_id;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line ('Drive Upd failed: '||a1.drive_id||
                                        ' '||substr(sqlerrm,1,45));
                  t_upd_cnt := t_upd_cnt - 1;
                  t_rej_cnt := t_rej_cnt + 1;
            END;
---
            IF (nvl(t_status,'xxx') = 'CANCL') THEN
               BEGIN
                  UPDATE drives
                     SET cancel_date = nvl(cancel_date,t_cancel_date),
                         cancel_user = nvl(cancel_user,t_cancel_user),
                         cancel_reason = nvl(cancel_reason,t_cancel_reason)
                   WHERE drive_id = a1.drive_id;
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line ('Drv cancel fail: '||a1.drive_id||
                                        ' '||substr(sqlerrm,1,45));
               END;
            ELSE
               BEGIN
                  UPDATE drives
                     SET cancel_date = null,
                         cancel_user = null,
                         cancel_reason = null
                   WHERE drive_id = a1.drive_id
                     AND t_status = 'CNFRM'
                     AND cancel_user = 'DONSYS'
                     AND cancel_reason = 'Cancelled from Hemasphere'
                     AND cancel_date IS NOT NULL;
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line ('Drv cancel fail: '||a1.drive_id||
                                        ' '||substr(sqlerrm,1,45));
               END;
            END IF;
         ELSIF (t_chk_flag = 'N') THEN
            t_ins_cnt := t_ins_cnt + 1;
            BEGIN
               INSERT INTO drives
                  (drive_id, chapter_id, drive_date, drive_type,
                   schedule_start_time, schedule_end_time, recruiter_id,
                   location_id, status, cancel_date, cancel_user,
                   cancel_reason, projected_draw, projected_show,
                   open_drive_ind, drive_category,    --- territory_id,
                   last_modified_date, last_modified_user, os_ok_flag,
                   program_id, insert_date, insert_user, audit_key)
               VALUES
                  (a1.drive_id, 'WAD', a1.drive_date, nvl(t_drive_type,'I'),
                   a1.sched_start_time, a1.sched_end_time,
                   nvl(t_staff_no,'11854'),
                   a1.location_id, nvl(t_status,'CNFRM'),
                   t_cancel_date, t_cancel_user, t_cancel_reason,
                   0,0,   --- a1.projected_draw, a1.projected_show,
                   a1.open_to_public, nvl(t_drv_cat,'ROUTN'),  --- territory_id,
                   sysdate, 'DONSYS', 'Y',   ---- a1.os_ok_flag,
                   'HS_INTRF', sysdate, 'DONSYS', null);
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line ('Drive ins failed: '||a1.drive_id);
                  dbms_output.put_line (substr(sqlerrm,1,160));
                  t_ins_cnt := t_ins_cnt - 1;
                  t_rej_cnt := t_rej_cnt + 1;
            END;
         ELSIF (t_chk_flag = 'S') THEN
            t_rej_cnt := t_rej_cnt + 1;
         END IF;
---
---   Same for drive_facilities
---
         IF (t_chk_flag != 'S') THEN
            t_exist_flag := 'N';
            BEGIN
               SELECT distinct('Y')
                 INTO t_exist_flag
                 FROM drive_facilities
                WHERE drive_id = a1.drive_id;
            EXCEPTION
               WHEN no_data_found THEN
                  t_exist_flag := 'N';
               WHEN others THEN
                  t_exist_flag := 'Y';
            END;
---
--- if no record exists then insert, if so, update
---
            IF (t_exist_flag = 'N') THEN
               BEGIN
                  INSERT INTO drive_facilities
                     (drive_id, chapter_id, facility_code,
                      insert_date, insert_user)
                  VALUES
                     (a1.drive_id, 'WAD', t_fac_code,
                      sysdate, 'DONSYS');
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line('Error ins facility: '||
                                          a1.drive_id||' '||
                                          substr(sqlerrm,1,50));
               END;
            ELSE
               BEGIN
                  UPDATE drive_facilities
                     SET facility_code = t_fac_code
                   WHERE drive_id = a1.drive_id
                     AND facility_code != t_fac_code;
               EXCEPTION
                  WHEN others THEN
                     null;
               END;
            END IF;
         END IF;
---
---   Same for drive_sponsors
---
         IF (t_chk_flag != 'S') THEN
            t_exist_flag := 'N';
            BEGIN
               SELECT distinct('Y')
                 INTO t_exist_flag
                 FROM drive_sponsors
                WHERE drive_id = a1.drive_id;
---               AND sponsor_id = a1.sponsor_id;
            EXCEPTION
               WHEN no_data_found THEN
                  t_exist_flag := 'N';
               WHEN others THEN
                  t_exist_flag := 'Y';
            END;
---
--- if no record exists then insert, if so, update
---
            IF (t_exist_flag = 'N') THEN
               BEGIN
                  INSERT INTO drive_sponsors
                     (drive_id, chapter_id, sponsor_id, projected_show,
                      projected_draw, contact_id, proj_deferral_rate,
                      program_id, insert_date, insert_user, audit_key)
                  VALUES
                     (a1.drive_id, 'WAD', a1.sponsor_id, a1.projected_show,
                      a1.projected_draw, null, null,
                      'HS_INTRF', sysdate, 'DONSYS', null);
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line('Error ins drive_sponsor: '||
                                          a1.drive_id||' '||
                                          substr(sqlerrm,1,45));
               END;
            ELSE
               BEGIN
                  UPDATE drive_sponsors
                     SET projected_show = a1.projected_show,
                         sponsor_id = a1.sponsor_id
                   WHERE drive_id = a1.drive_id
                     AND (sponsor_id != a1.sponsor_id
                      OR projected_show != a1.projected_show);
               EXCEPTION
                  WHEN others THEN
                     null;
               END;
---
               BEGIN
                  UPDATE drive_sponsors
                     SET projected_draw = a1.projected_draw,
                         sponsor_id = a1.sponsor_id
                   WHERE drive_id = a1.drive_id
                     AND (sponsor_id != a1.sponsor_id
                      OR projected_draw != a1.projected_draw);
               EXCEPTION
                  WHEN others THEN
                     null;
               END;
            END IF;
         END IF;
---
---   Same for drive_estimated_resources
---
         IF (t_chk_flag != 'S') THEN
            t_number_reqd := 0;
            IF (a1.drive_type = 'C') THEN
               t_number_reqd := ceil((a1.projected_show/t_drive_hours)/6);
            END IF;
            t_exist_flag := 'N';
            BEGIN
               SELECT distinct('Y')
                 INTO t_exist_flag
                 FROM drive_estimated_resources
                WHERE drive_id = a1.drive_id
                  AND resource_code = 'COACH';
            EXCEPTION
               WHEN no_data_found THEN
                  t_exist_flag := 'N';
               WHEN others THEN
                  t_exist_flag := 'Y';
            END;
---
--- if no record exists then insert, if so, update
---
            IF (t_exist_flag = 'N') THEN
               BEGIN
                  INSERT INTO drive_estimated_resources
                     (drive_id, chapter_id, resource_code,
                      number_reqd, program_id, insert_date,
                      insert_user, audit_key, sort_seq)
                  VALUES
                     (a1.drive_id, 'WAD', 'COACH',
                      t_number_reqd, 'HS_INTRF', sysdate,
                      'DONSYS', null, 3);
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line('Error ins drive_est_resrc: '||
                                          a1.drive_id||' COACH '||
                                          substr(sqlerrm,1,55));
               END;
            ELSE
               BEGIN
                  UPDATE drive_estimated_resources
                     SET number_reqd = t_number_reqd
                   WHERE drive_id = a1.drive_id
                     AND resource_code = 'COACH'
                     AND number_reqd != t_number_reqd;
               EXCEPTION
                  WHEN others THEN
                      null;
               END;
            END IF;
         END IF;
---
---
         IF (t_chk_flag != 'S') THEN
            t_number_reqd := 0;
            IF (a1.drive_type = 'I') THEN
               t_number_reqd := ceil((a1.projected_show/t_drive_hours)/6);
            END IF;
            t_exist_flag := 'N';
            BEGIN
               SELECT distinct('Y')
                 INTO t_exist_flag
                 FROM drive_estimated_resources
                WHERE drive_id = a1.drive_id
                  AND resource_code = 'VAN';
            EXCEPTION
               WHEN no_data_found THEN
                  t_exist_flag := 'N';
               WHEN others THEN
                  t_exist_flag := 'Y';
            END;
---
--- if no record exists then insert, if so, update
---
            IF (t_exist_flag = 'N') THEN
               BEGIN
                  INSERT INTO drive_estimated_resources
                     (drive_id, chapter_id, resource_code,
                      number_reqd, program_id, insert_date,
                      insert_user, audit_key, sort_seq)
                  VALUES
                     (a1.drive_id, 'WAD', 'VAN',
                      t_number_reqd, 'HS_INTRF', sysdate,
                      'DONSYS', null, 4);
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line('Error ins drive_est_resrc: '||
                                          a1.drive_id||' VAN '||
                                          substr(sqlerrm,1,55));
               END;
            ELSE
               BEGIN
                  UPDATE drive_estimated_resources
                     SET number_reqd = t_number_reqd
                   WHERE drive_id = a1.drive_id
                     AND resource_code = 'VAN'
                     AND number_reqd != t_number_reqd;
               EXCEPTION
                  WHEN others THEN
                      null;
               END;
            END IF;
         END IF;
---
         IF (t_chk_flag != 'S') THEN
            t_number_reqd := ceil((a1.projected_show/t_drive_hours)/4);
            t_exist_flag := 'N';
            BEGIN
               SELECT distinct('Y')
                 INTO t_exist_flag
                 FROM drive_estimated_resources
                WHERE drive_id = a1.drive_id
                  AND resource_code = 'STAFF';
            EXCEPTION
               WHEN no_data_found THEN
                  t_exist_flag := 'N';
               WHEN others THEN
                  t_exist_flag := 'Y';
            END;

---
---    if no record exists then insert, if so, update
---
            IF (t_exist_flag = 'N') THEN
               BEGIN
                  INSERT INTO drive_estimated_resources
                     (drive_id, chapter_id, resource_code,
                      number_reqd, program_id, insert_date,
                      insert_user, audit_key, sort_seq)
                  VALUES
                     (a1.drive_id, 'WAD', 'STAFF',
                      t_number_reqd, 'HS_INTRF', sysdate,
                      'DONSYS', null, 1);
               EXCEPTION
                  WHEN others THEN
                     dbms_output.put_line('Error ins drive_est_resrc: '||
                                          a1.drive_id||' STAFF '||
                                          substr(sqlerrm,1,55));
               END;
            ELSE
               BEGIN
                  UPDATE drive_estimated_resources
                     SET number_reqd = t_number_reqd
                   WHERE drive_id = a1.drive_id
                     AND resource_code = 'STAFF'
                     AND number_reqd != t_number_reqd;
               EXCEPTION
                  WHEN others THEN
                      null;
               END;
            END IF;
         END IF;
---
---   At end of update reset the drive projections in the drive table
---
         IF (t_chk_flag != 'S') THEN
            BEGIN
               UPDATE drives
                  SET projected_show = a1.projected_show
                WHERE drive_id = a1.drive_id
                  AND projected_show != a1.projected_show;
            EXCEPTION
               WHEN others THEN
                  null;
            END;
         END IF;
---
         IF (t_chk_flag != 'S') THEN
            BEGIN
               UPDATE drives
                  SET projected_draw = a1.projected_draw
                WHERE drive_id = a1.drive_id
                  AND projected_draw != a1.projected_draw;
            EXCEPTION
               WHEN others THEN
                  null;
            END;
---         COMMIT;
         END IF;
---
         IF (t_chk_flag != 'S') THEN

            BEGIN
               UPDATE hp_drive2
                  SET lt_read_date = sysdate
                 WHERE rowid = a1.rowid;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line ('Problem Updating interim '||
                                        'database for drive: '||a1.drive_id);
                  dbms_output.put_line (substr(sqlerrm,1,78));
            END;
---         COMMIT;
         END IF;
      ELSE
         t_rej_cnt := t_rej_cnt + 1;
      END IF;
   END LOOP;
  dbms_output.put_line ('End Drive Interface');
  dbms_output.put_line ('===================');
  dbms_output.put_line ('Processed: '||to_char(t_count,'99,999')||' records');
  dbms_output.put_line ('Inserted:  '||to_char(t_ins_cnt,'99,999')||' records');
  dbms_output.put_line ('Updated:   '||to_char(t_upd_cnt,'99,999')||' records');
  dbms_output.put_line ('Skipped:   '||to_char(t_rej_cnt,'99,999')||' records');
END;
/
commit;
spool off
exit;

