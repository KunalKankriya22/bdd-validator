set serveroutput on
spool /tmp/hs2lt_location
DECLARE
---
   t_chk_flag      VARCHAR2(1);
   t_exist_flag    VARCHAR2(1);
   t_skip_flag     VARCHAR2(1);
   t_loc_id        VARCHAR2(1);
   t_addr_flag     VARCHAR2(1);
   t_term_date     DATE;
---
   t_chk_city      VARCHAR2(1);
   v_add_id        NUMBER;
   v_address       VARCHAR2(10);
   v_usps_id       NUMBER(6);
   v_count         NUMBER(3);
   t_count         NUMBER := 0;
   t_insert        NUMBER := 0;
   t_update        NUMBER := 0;
   t_skip          NUMBER := 0;
   t_check         VARCHAR2(1);
---
   CURSOR get_data IS
      SELECT location_id,location_type,
             upper(location_name) location_name,eff_date,term_date,
             decode(staff_facility,'BED','BDF',staff_facility) staff_facility,
             decode(zone,'BED','BDF',zone) zone,
             upper(street_name) street_name,
             upper(street_name_2) street_name_2,
             upper(suite_apt) suite_apt,
             upper(city) city,upper(state) state,zip,
             upper(e_mail) e_mail,area_code,phone_no,
             decode(extension,0,null,extension) extension,
             insert_date,lt_read_date,rowid
        FROM hp_location hp
       WHERE insert_date >= trunc(sysdate)-7
         AND insert_date >= nvl(lt_read_date,insert_date-1)
         AND NOT EXISTS
            (SELECT 'X'
               FROM locations l2, valid_city_state v2, addresses a2
              WHERE l2.location_id = hp.location_id
                AND l2.location_type = hp.location_type
                AND l2.location_name = upper(hp.location_name)
                AND l2.staff_facility = decode(hp.staff_facility,'BED','BDF',
                                               hp.staff_facility)
                AND l2.zone = decode(hp.zone,'BED','BDF',hp.zone)
                AND l2.address_id = a2.address_id
---
                AND nvl(a2.street_name,'UNK_JMC') =
                    nvl(upper(hp.street_name),nvl(a2.street_name,'UNK_JMC'))
                AND nvl(a2.suite_apt,'UNK_JMC') =
                    nvl(upper(hp.suite_apt),nvl(a2.suite_apt,'UNK_JMC'))
                AND nvl(a2.address_1,'UNK_JMC') =
                    nvl(upper(hp.street_name_2),nvl(a2.address_1,'UNK_JMC'))
                AND nvl(a2.e_mail,'UNK_JMC') =
                    nvl(upper(hp.e_mail),nvl(a2.e_mail,'UNK_JMC'))
                AND nvl(a2.d_area_code,'UNK') =
                    nvl(hp.area_code,nvl(a2.d_area_code,'UNK'))
                AND nvl(a2.d_phone_no,'UNK_JMC') =
                    nvl(hp.phone_no,nvl(a2.d_phone_no,'UNK_JMC'))
---
---             AND nvl(a2.extension,987988) =
---                 nvl(decode(hp.extension,1,null,hp.extension),987988)
                AND a2.usps_id = v2.usps_id
                AND v2.city = upper(hp.city)
                AND v2.state = hp.state
                AND v2.zip = hp.zip);
BEGIN
   dbms_output.put_line('LifeTrak to Hemasphere Location Interface '||',' ||
                        to_char(sysdate,'DD-Mon-RR HH24:MI'));
   dbms_output.put_line('=================================='||
                        '==================================');
---
   t_count := 0;
   t_insert := 0;
   t_update := 0;
   t_skip := 0;
---
   FOR a1 IN get_data LOOP
---
      t_count := t_count + 1;
      IF (a1.term_date = to_date('31-DEC-9999')) THEN
         t_term_date := null;
      ELSE
         t_term_date := a1.term_date;
      END IF;
---
---   Verify location_id
---
      t_skip_flag := 'N';
      IF (a1.location_id IS NOT NULL) THEN
         BEGIN
            SELECT 'Y'
              INTO t_loc_id
              FROM locations
             WHERE location_id = a1.location_id;
         EXCEPTION
            WHEN others THEN
               t_loc_id := 'N';
         END;
      ELSE
         t_loc_id := 0;
         t_skip_flag := 'Y';
      END IF;
---
---   Verify location_type
---
      t_chk_flag := 'N';
      BEGIN
         SELECT 'Y'
           INTO t_chk_flag
           FROM valid_master_codes
          WHERE code_type = 'LOCTY'
            AND code = a1.location_type
            AND sysdate BETWEEN eff_date AND NVL(term_date,sysdate+1);
      EXCEPTION
         WHEN others THEN
            dbms_output.put_line('Invalid location type:'||
                                 a1.location_id);
            t_skip_flag := 'Y';
      END;
---
---   verify staff_facility
---
      t_chk_flag := 'N';
      BEGIN
         SELECT 'Y'
           INTO t_chk_flag
           FROM valid_master_codes
          WHERE code_type = 'FACLT'
            AND code = a1.staff_facility
            AND sysdate BETWEEN eff_date AND nvl(term_date,sysdate+1);
      EXCEPTION
         WHEN others THEN
            t_skip_flag := 'Y';
            dbms_output.put_line('Invalid staff facility: '||
                                 a1.location_id);
      END;
---
---   Verify zone
---
      t_chk_flag:='N';
      BEGIN
         SELECT 'Y'
           INTO t_chk_flag
           FROM valid_master_codes
          WHERE code_type = 'ZONE'
            AND code = a1.zone
            AND sysdate BETWEEN eff_date AND nvl(term_date,sysdate+1);
      EXCEPTION
         WHEN others THEN
            t_skip_flag := 'Y';
            dbms_output.put_line('Invalid zone:'||a1.location_id);
      END;
---
---   Verify city,state,zip
---
      BEGIN
         SELECT min(usps_id)
           INTO v_usps_id
           FROM valid_city_state v2
          WHERE v2.city = upper(a1.city)
            AND v2.state = a1.state
            AND v2.zip = a1.zip
            AND sysdate BETWEEN v2.eff_date AND nvl(v2.term_date,sysdate+1);
      EXCEPTION
         WHEN others THEN
            v_usps_id := null;
            dbms_output.put_line('Invalid city,state,zip:'||a1.location_id);
      END;
---
      IF (t_loc_id='N' AND t_skip_flag !='Y') THEN
         t_insert := t_insert + 1;
         BEGIN
            SELECT address_sequence.nextval
              INTO v_add_id
              FROM dual;
         EXCEPTION
            WHEN others THEN
               V_add_id := null;
         END;
---
         BEGIN
            INSERT INTO locations
               (location_id,chapter_id,location_type,location_name,
                address_id,site_directions,travel_time,travel_distance,
                nearest_hospital_id,note_id,conv_location_id,program_id,
                insert_date,insert_user,open_time,close_time,
                fda_license_date,site_manager,eff_date,term_date,
                rotation_flag,staff_facility,zone )
            VALUES
               (a1.location_id,'WAD',a1.location_type,a1.location_name,
                trim(to_char(v_add_id,'9999999999')),null,null,null,null,
                null,null,'HS_INTRF',a1.insert_date,'DONSYS',null,
                null,null,null,a1.eff_date,t_term_date,null,
                a1.staff_facility,a1.zone);
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line ('Cannot Insert Location: '||
                                     a1.location_id);
         END;
------
         IF (v_usps_id IS NOT NULL AND v_add_id IS NOT NULL) THEN
            BEGIN
               INSERT INTO addresses
                 (address_id,chapter_id,street_name,usps_id,address_1,
                  address_2,address_3,d_country_code,extension,h_phone_no,
                  f_phone_no,e_mail,web_address,mapsco,suite_apt,zip4,
                  d_area_code,d_phone_no,h_country_code,h_area_code,
                  f_country_code,f_area_code,m_area_code,m_phone_no,
                  pager,eff_date,term_date,program_id,insert_date,
                  insert_user)
               VALUES
                 (trim(to_char(v_add_id,'9999999999')),'WAD',
                  a1.street_name,v_usps_id,a1.street_name_2,
                  null,null,null,a1.extension,null,null,a1.e_mail,null,
                  null,a1.suite_apt,null,a1.area_code,a1.phone_no,null,
                  null,null,null,null,null,null,a1.eff_date,t_term_date,
                  'HS_INTRF',a1.insert_date,'DONSYS');
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line('cannot insert new location address '||
                                       a1.location_id);
---               dbms_output.put_line(substr(sqlerrm,1,78));
            END;
         ELSE
            dbms_output.put_line('Cannot insert new address '||
                                  a1.location_id);
         END IF;
---
      ELSIF (t_loc_id = 'Y' AND t_skip_flag != 'Y') THEN
         t_update := t_update + 1;
         t_check := 'N';
         BEGIN
            SELECT distinct('Y')
              INTO t_check
              FROM locations
             WHERE locations.location_id = a1.location_id
               AND locations.location_type = 'FIX'
               AND sysdate BETWEEN locations.eff_date
                               AND nvl(locations.term_date,sysdate+1);
         EXCEPTION
            WHEN others THEN
               t_check := 'N';
         END;
         IF (t_check = 'N') THEN
         BEGIN
            UPDATE locations
               SET location_type = a1.location_type,
                   location_name = a1.location_name,
                   insert_date = a1.insert_date,
                   eff_date = a1.eff_date,
                   term_date = t_term_date,
                   staff_facility = a1.staff_facility,
                   zone = a1.zone
             WHERE location_id = a1.location_id;
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line('cannot update location id');
         END;
         END IF;
---
---   check address_id
---
         BEGIN
            SELECT address_id
              INTO v_address
              FROM locations l
             WHERE l.location_id=a1.location_id;
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line('address id does not exist');
               v_address := null;
         END;
---
         t_addr_flag := 'N';
         BEGIN
            SELECT 'Y' INTO t_addr_flag
              FROM addresses
             WHERE address_id = v_address;
         EXCEPTION
            WHEN others THEN
               t_addr_flag := 'N';
         END;
---
         IF (t_addr_flag = 'Y') THEN
            BEGIN
               UPDATE addresses
                  SET street_name = a1.street_name,
                      address_1 = a1.street_name_2,
                      extension = a1.extension,
                      e_mail = a1.e_mail,
                      suite_apt = a1.suite_apt,
                      d_area_code = a1.area_code,
                      d_phone_no = a1.phone_no,
                      usps_id = v_usps_id
                WHERE address_id = v_address;
             EXCEPTION
                WHEN others THEN
                   dbms_output.put_line('Cannot update address '||
                                        a1.location_id);
             END;
         ELSE
             IF (v_usps_id IS NOT NULL AND v_address IS NOT NULL) THEN
                BEGIN
                   INSERT INTO addresses
                      (address_id,chapter_id,street_name,usps_id,
                       address_1,address_2,address_3,d_country_code,
                       extension,h_phone_no,f_phone_no,e_mail,web_address,
                       mapsco,suite_apt,zip4,d_area_code,d_phone_no,
                       h_country_code,h_area_code,f_country_code,
                       f_area_code,m_area_code,m_phone_no,pager,
                       eff_date,term_date,program_id,insert_date,
                       insert_user)
                   VALUES
                      (v_address,'WAD',a1.street_name,v_usps_id,
                       a1.street_name_2,null,null,null,a1.extension,null,
                       null,a1.e_mail,null,null,a1.suite_apt,null,
                       a1.area_code,a1.phone_no,null,null,null,null,
                       null,null,null,a1.eff_date,t_term_date,'HS_INTRF',
                       a1.insert_date,'DONSYS');
                EXCEPTION
                   WHEN others THEN
                      dbms_output.put_line('Cannot insert address '||
                                           a1.location_id);
---                   dbms_output.put_line(substr(sqlerrm,1,78));
                END;
             END IF;
         END IF;
      ELSE
         t_skip := t_skip + 1;
      END IF;
---
      IF (t_skip_flag = 'N') THEN
         BEGIN
            UPDATE hp_location
               SET lt_read_date=sysdate
             WHERE rowid=a1.rowid;
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line ('cannot update ltrec');
         END;
      END IF;
   END LOOP;
---
   commit;
---
   dbms_output.put_line ('End LifeTrak to Hemasphere Location Interface');
   dbms_output.put_line ('=============================================');
   dbms_output.put_line ('Interfaced: '||to_char(t_count,'999,999')||
                         ' records');
   dbms_output.put_line ('Inserted:   '||to_char(t_insert,'999,999')||
                         ' records');
   dbms_output.put_line ('Updated:    '||to_char(t_update,'999,999')||
                         ' records');
   dbms_output.put_line ('Skipped:    '||to_char(t_skip,'999,999')||
                         ' records');
---
   BEGIN
      UPDATE locations
         SET location_type = 'FIX'
       WHERE nvl(rotation_flag,'N') = 'Y'
         AND location_type != 'FIX';
   EXCEPTION
      WHEN others THEN
         dbms_output.put_line ('Error in updating Rotation Sites');
         dbms_output.put_line (substr(sqlerrm,1,75));
   END;
   COMMIT;
END;
/

spool off
exit;
/

