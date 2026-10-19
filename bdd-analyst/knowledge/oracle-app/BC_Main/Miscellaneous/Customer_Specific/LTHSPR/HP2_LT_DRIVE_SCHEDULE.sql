set serveroutput on
spool /tmp/hs2lt_drive_sched
DECLARE
   CURSOR get_data IS
      SELECT drive_id, sponsor_id, location_id,
             to_date(drive_date, 'DD-Mon-RR') drive_date, proc_code,
             to_date(time_of_day, 'DD-Mon-RR HH24:MI:SS') sch_time,
             max_slots, insert_date, lt_read_date, rowid
        FROM hp_drive_schedule2 ds
       WHERE insert_date >= trunc(sysdate)-7
         AND nvl(lt_read_date,sysdate-8) < insert_date
------   AND proc_code != 'DR'
         AND NOT EXISTS
            (SELECT 'x' 
               FROM mobile_drive_capacity@iwebb.world mdc
              WHERE mdc.drive_id = ds.drive_id
                AND mdc.drive_date = to_date(ds.drive_date, 'DD-Mon-RR')
                AND mdc.don_type = ds.proc_code
                AND mdc.max_capacity = nvl(ds.max_slots, mdc.max_capacity)
                AND mdc.sch_time = to_date(ds.time_of_day,
                                    'DD-Mon-RR HH24:MI:SS'))
         ORDER BY drive_id, insert_date;
---
   t_count           NUMBER := 0;
   t_ins             NUMBER := 0;
   t_upd             NUMBER := 0;
   t_skp             NUMBER := 0;
   t_location_id     VARCHAR2(10);
   t_proc_code       VARCHAR2(5);
   t_skip_flag       VARCHAR2(1);
   t_exist_flag      VARCHAR2(1);
   t_flag            VARCHAR2(1);
---
BEGIN
   dbms_output.enable(1000000);
   dbms_output.put_line ('Start Drive Sched Interface '||
                         'Hemasphere to LifeTrak: '||
                         to_char(sysdate,'DY MM-DD-YYYY HH24:MI'));
   dbms_output.put_line ('===================================='||
                         '====================================');
---
---   Begin by removing any schedule info for drives that are currently 
---   cancelled
---
   BEGIN
      UPDATE hp_drive_schedule2 hp
         SET lt_read_date = sysdate
       WHERE insert_date >= nvl(lt_read_date,insert_date+1)
         AND EXISTS
             (SELECT 'X'
                FROM drives
               WHERE drives.drive_id = hp.drive_id
                 AND drives.drive_date = hp.drive_date
                 AND drives.location_id = hp.location_id
                 AND drives.status = 'CANCL'
                 AND EXISTS
                    (SELECT 'x' FROM drive_sponsors ds2
                      WHERE ds2.drive_id = drives.drive_id
                        AND ds2.sponsor_id = hp.sponsor_id));
   EXCEPTION
      WHEN others THEN
         null;
   END;
---
   COMMIT;
---
   FOR a1 IN get_data LOOP
      t_skip_flag := 'N';
      t_exist_flag := 'N';
      t_count := t_count + 1;
---
      BEGIN
         SELECT location_id, 'Y'
           INTO t_location_id, t_exist_flag
           FROM drives
          WHERE drives.drive_id = a1.drive_id
            AND drives.drive_date = a1.drive_date
            AND drives.location_id = a1.location_id
            AND drives.status IN ('CNFRM')
            AND EXISTS
               (SELECT 'x' FROm drive_sponsors ds2
                 WHERE ds2.drive_id = drives.drive_id
                   AND ds2.sponsor_id = a1.sponsor_id) ;
      EXCEPTION
         WHEN others THEN
---         dbms_output.put_line('Invalid location: '||a1.drive_id||
---                              '  '||a1.location_id);
---         dbms_output.put_line(substr(sqlerrm,1,78));
            t_exist_flag := 'N';
      END;
---
      IF (t_exist_flag = 'Y') THEN
         t_flag := 'N';
         BEGIN
            SELECT distinct('Y')
              INTO t_flag
              FROM mobile_drive_capacity@iwebb.world mdc
             WHERE drive_id = a1.drive_id
               AND mdc.drive_date = a1.drive_date
               AND mdc.sch_time = a1.sch_time
               AND mdc.don_type = a1.proc_code;
         EXCEPTION
            WHEN others THEN
               t_flag := 'N';
         END;
---
         BEGIN
            UPDATE blood_drives@iwebb
               SET adv_signup = 'Y'
             WHERE drive_id = a1.drive_id
               AND drive_date = a1.drive_date
               AND nvl(adv_signup,'N') = 'N';
         EXCEPTION
            WHEN others THEN
               null;
         END;
---
         BEGIN
            UPDATE blood_drives@iwebb
               SET don_types = trim(don_types)||trim(a1.proc_code)||';'
             WHERE drive_id = a1.drive_id
               AND drive_date = a1.drive_date
               AND instr(don_types,a1.proc_code) = 0;
         EXCEPTION
            WHEN others THEN
               null;
         END;
---
         IF (t_flag = 'Y') THEN
            t_upd := t_upd + 1;
            BEGIN
               UPDATE mobile_drive_capacity@iwebb.world mdc
                  SET max_capacity = nvl(a1.max_slots, max_capacity)
                WHERE drive_id = a1.drive_id
                  AND mdc.drive_date = a1.drive_date
                  AND mdc.sch_time = a1.sch_time
                  AND mdc.don_type = a1.proc_code;
            EXCEPTION
               WHEN others THEN
                  t_upd := t_upd - 1;
                  t_skp := t_skp + 1;
                  t_skip_flag := 'Y';
                  dbms_output.put_line('Error in upd drive_schedule for: '||
                                       a1.drive_id);
                  dbms_output.put_line(substr(sqlerrm,1,78));
            END;
         ELSE
            t_ins := t_ins + 1;
            BEGIN
               INSERT INTO mobile_drive_capacity@iwebb.world
                  (drive_id, drive_date, don_type, sch_time,
                   max_capacity, booked, sponsor_id, location_id,
                   Insert_date, program_id, bc_id, reg_id)
               VALUES
                  (a1.drive_id, a1.drive_date, a1.proc_code,
                   a1.sch_time, a1.max_slots, 0,
                   a1.sponsor_id, t_location_id,
                   sysdate, 'HS_INTRF', 'WAD','GWAD');
            EXCEPTION
               WHEN others THEN
                  t_ins := t_ins - 1;
                  t_skp := t_skp + 1;
                  t_skip_flag := 'Y';
                  dbms_output.put_line('Error inserting drive_schedule for: '||
                                       a1.drive_id);
                  dbms_output.put_line(substr(sqlerrm,1,78));
            END;
         END IF;
---
         IF (t_skip_flag = 'N') THEN
            BEGIN
               UPDATE hp_drive_schedule2
                  SET lt_read_date = sysdate
                WHERE rowid = a1.rowid;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line('Error updating read_date '||a1.rowid);
            END;
            commit;
         END IF;
      ELSE
         t_skp := t_skp + 1;
      END IF;
   END LOOP;
---
   dbms_output.put_line ('End Drive Scheduled Interface');
   dbms_output.put_line ('=============================');
   dbms_output.put_line ('Processed: '||to_char(t_count,'99,999')||' records');
   dbms_output.put_line ('Inserted:  '||to_char(t_ins,'99,999')||' records');
   dbms_output.put_line ('Updated:   '||to_char(t_upd,'99,999')||' records');
   dbms_output.put_line ('Skipped:   '||to_char(t_skp,'99,999')||' records');
END;
/
commit;
---
DELETE FROM mobile_drive_capacity@iwebb.world mdc
 WHERE drive_date >= trunc(sysdate)
   AND NOT EXISTS
       (SELECT 'x' FROM drives drv2
         WHERE drv2.drive_id = mdc.drive_id
           AND trunc(drv2.drive_date) = trunc(mdc.drive_date))
   AND booked = 0;
commit;
---
DELETE FROM mobile_drive_capacity@iwebb.world mdc
 WHERE drive_date >= trunc(sysdate)
   AND EXISTS
       (SELECT 'x' FROM drives drv2
         WHERE drv2.drive_id = mdc.drive_id
           AND trunc(drv2.drive_date) = trunc(mdc.drive_date)
           AND drv2.status = 'CNFRM')
   AND EXISTS
       (SELECT 'x' FROM drives drv2
         WHERE drv2.drive_id = mdc.drive_id
           AND mdc.SCH_TIME NOT BETWEEN drv2.SCHEDULE_START_TIME
                                    AND drv2.SCHEDULE_END_TIME )
   AND booked = 0;
commit;
---
DELETE FROM mobile_drive_capacity@iwebb.world mdc
 WHERE drive_date >= trunc(sysdate)
   AND EXISTS
       (SELECT 'x' FROM drives drv2
         WHERE drv2.drive_id = mdc.drive_id
           AND trunc(drv2.drive_date) = trunc(mdc.drive_date)
           AND drv2.status = 'CANCL')
   AND NOT EXISTS
       (SELECT 'x' FROM drives drv2
         WHERE drv2.drive_id = mdc.drive_id
           AND trunc(drv2.drive_date) = trunc(mdc.drive_date)
           AND drv2.status = 'CNFRM')
   AND booked = 0;
commit;
spool off;
exit;

