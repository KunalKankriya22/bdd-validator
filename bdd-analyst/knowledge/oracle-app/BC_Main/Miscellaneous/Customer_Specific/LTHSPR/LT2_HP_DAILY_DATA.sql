set serveroutput on
set trimspool on
spool /tmp/daily_lifetrak_to_hemasphere_data
DECLARE
   t_count       NUMBER := 0;
   t_exist       VARCHAR2(1);
   t_upd_cnt     NUMBER := 0;
   skip_flag     VARCHAR2(1);
---
   CURSOR get_data IS
      SELECT nvl(unit_id, deferral_id) donation_id,
             drive_id, coll_date,
             least(nvl(bleed_start_time_l1,sysdate),
                   nvl(bleed_start_time_l2,sysdate),
                   nvl(bleed_start_time_r1,sysdate),
                   nvl(bleed_start_time_r2,sysdate),
                   insert_date) donation_time,
             decode(unit_id, null,'DEFERRAL','DONATION') donation_status,
             (SELECT decode(blood_type,'51','O+','62','A+','73','B+','84','AB+',
                                       '95','O-','06','A-','17','B-','28','AB-',
                                       null)
                FROM donors
               WHERE donors.donor_id = donations.donor_id) blood_type,
             procedure_code,
             (SELECT distinct('Y') FROM donation_attributes da2
               WHERE da2.transaction_id = donations.transaction_id
                 AND da2.attrib_code = 'VENI'
                 AND da2.attrib_value IN ('04','05')) qns,
             (SELECT distinct('Y') FROM donation_attributes da2
               WHERE da2.transaction_id = donations.transaction_id
                 AND da2.attrib_code = 'VENI'
                 AND da2.attrib_value = '02') double_stick,
             (SELECT distinct('Y')
                FROM donor_schedule ds2
               WHERE ds2.donor_id = donations.donor_id
                 AND ds2.sch_date = donations.coll_date
                 AND ds2.program_id = 'INTERNET') scheduled_online,
             (SELECT distinct('Y')
                FROM dual
               WHERE NOT EXISTS
                    (SELECT 'x' FROM donations d2
                      WHERE d2.donor_id = donations.donor_id
                        AND d2.coll_date < donations.coll_date)) ftd_flag,
             (SELECT min(ds2.sponsor_id) 
                FROM drive_sponsors ds2
               WHERE ds2.drive_id = donations.drive_id) lt_account_id,
             (SELECT location_id
                FROM drives dr2
               WHERE dr2.drive_id = donations.drive_id) lt_site_id
        FROM donations
       WHERE nvl(unit_id, deferral_id) IS NOT NULL
         AND transaction_id IN
            (SELECT d2.transaction_id FROM donations d2
              WHERE d2.coll_date BETWEEN trunc(sysdate)-2 
                                     AND trunc(sysdate)-1
                AND d2.donor_id IS NOT NULL
             UNION
             SELECT d3.transaction_id FROM donations d3
              WHERE d3.coll_date BETWEEN trunc(sysdate)-14 
                                     AND trunc(sysdate)-3
                AND d3.donor_id IS NOT NULL
                AND (d3.insert_date >= trunc(sysdate)-2
                 OR EXISTS
                    (SELECT 'x' FROM donations_audit da3
                      WHERE da3.audit_key = d3.audit_key
                        AND da3.column_name IN ('donor_id','drive_id',
                                                'procedure_code','coll_date',
                                                'unit_id','deferral_id')
                        AND da3.audit_insert_dats >= trunc(sysdate)-2)
                 OR EXISTS
                   (SELECT 'x' FROM donation_attributes da4
                     WHERE da4.transaction_id = d3.transaction_id
                       AND da4.attrib_code = 'VENI'
                       AND da4.attrib_value IN ('02','04','05')
                       AND da4.insert_date >= trunc(sysdate)-2)))
         AND NOT EXISTS
            (SELECT 'x' FROM drives dr2
              WHERE dr2.drive_id = donations.drive_id
                AND dr2.drive_type = 'F');
---
BEGIN
   dbms_output.enable(1000000);
   dbms_output.put_line ('Start of Daily Interface to Hemasphere for: '||
                         to_char(sysdate-1,'Dy MM-DD-YYYY'));
   dbms_output.put_line ('============================================'||
                         '==============');
   t_count := 0;
   t_upd_cnt := 0;
---
   skip_flag := 'N';
   FOR a1 IN get_data LOOP
      t_exist := 'N';
      t_count := t_count + 1;
      BEGIN
         SELECT distinct('Y')
           INTO t_exist
           FROM hp_donation hp
          WHERE hp.donation_id = a1.donation_id
            AND hp.donation_date = a1.coll_date;
      EXCEPTION
         WHEN too_many_rows THEN
            t_exist := 'Y';
         WHEN others THEN
            t_exist := 'N';
      END;
---
      IF (t_exist = 'Y') THEN
         t_upd_cnt := t_upd_cnt + 1;
         BEGIN
            DELETE FROM hp_donation hp
             WHERE hp.donation_id = a1.donation_id
               AND hp.donation_date = a1.coll_date;
         EXCEPTION
            WHEN others THEN
               null;
         END;
      END IF;
---
      BEGIN
         INSERT INTO hp_donation
            (donation_id, drive_id, donation_date, donation_time,
             donation_status, blood_type, procedure_code, qns,
             double_stick, scheduled_online, first_time_donor,
             insert_date, interface_date, lt_account_id, lt_site_id)
         VALUES
            (a1.donation_id, a1.drive_id, a1.coll_date, a1.donation_time,
             a1.donation_status, a1.blood_type, a1.procedure_code, a1.qns,
             a1.double_stick, a1.scheduled_online, a1.ftd_flag,
             sysdate, null, a1.lt_account_id, a1.lt_site_id);
      EXCEPTION
         WHEN others THEN
            dbms_output.put_line('Error in insert: '||a1.donation_id||' '||
                                  substr(sqlerrm,1,45));
      END;
---
      commit;
   END LOOP;
   commit;
---
<<end_report>>
   IF (skip_flag = 'Y') THEN
      dbms_output.put_line ('*** Skipped report, due to time of day');
   END IF;
---
   dbms_output.put_line ('End of LifeTrak to Hemasphere Interface');
   dbms_output.put_line ('=======================================');
   dbms_output.put_line ('Interfaced: '||to_char(t_count,'999,999')||
                         ' records');
   dbms_output.put_line ('Inserted:   '||to_char(t_count-t_upd_cnt,'999,999')||
                         ' records');
   dbms_output.put_line ('Updated:    '||to_char(t_upd_cnt,'999,999')||
                         ' records');
END;
/
spool off
exit

