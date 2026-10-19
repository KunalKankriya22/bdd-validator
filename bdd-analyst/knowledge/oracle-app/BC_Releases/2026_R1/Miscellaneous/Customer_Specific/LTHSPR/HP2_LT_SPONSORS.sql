set serveroutput on
spool /tmp/hs2lt_sponsor
DECLARE
---
   t_chk_flag      VARCHAR2(1);
   t_exist_flag    VARCHAR2(1);
   t_skip_flag     VARCHAR2(1);
   t_loc_id        VARCHAR2(1);
   t_addr_flag     VARCHAR2(1);
   t_term_date     DATE;
   t_exist         VARCHAR2(1);
   t_parent_id     VARCHAR2(10);
   t_territory     VARCHAR2(10);
   t_category      VARCHAR2(5);
   t_lob           VARCHAR2(5);
---
   t_chk_city      VARCHAR2(1);
   v_add_id        NUMBER;
   v_address       VARCHAR2(10);
   v_usps_id       NUMBER(6);
   v_count         NUMBER;
   t_count         NUMBER := 0;
   t_insert        NUMBER := 0;
   t_update        NUMBER := 0;
   t_skip          NUMBER := 0;
---
   CURSOR get_data IS
      SELECT sponsor_id, upper(name) name, territory_id, status,
             employee_base, parent_sponsor_id, category, lob,
             default_location_id, eff_date, term_date,
             upper(street_name) street_name,
             upper(street_name_2) street_name_2,
             upper(suite_apt) suite_apt,
             upper(city) city,upper(state) state,zip,
             upper(e_mail) e_mail,area_code,phone_no,
             decode(extension,0,null,extension) extension,
             hp.insert_date,lt_read_date,rowid
        FROM hp_sponsor hp
       WHERE hp.insert_date >= trunc(sysdate)-7
         AND hp.insert_date >= nvl(lt_read_date,hp.insert_date-1)
         AND NOT EXISTS
            (SELECT 'X'
               FROM sponsors s2, valid_city_state v2, addresses a2,
                    lt_hs_code_xref xref1, lt_hs_code_xref xref2
              WHERE s2.sponsor_id = hp.sponsor_id
                AND s2.name = hp.name
                AND xref1.code_type = 'SCAT'
                AND xref2.code_type = 'LOB'
                AND hp.category = xref1.hs_desc
                AND hp.lob = xref2.hs_desc
                AND s2.territory_id = nvl(hp.territory_id,s2.territory_id)
                AND s2.default_location_id = 
                    nvl(hp.default_location_id,s2.default_location_id)
                AND s2.parent_sponsor_id = 
                    nvl(hp.parent_sponsor_id,s2.parent_sponsor_id)
                AND xref1.lt_code = s2.category
                AND xref2.lt_code = s2.lob
                AND s2.status = hp.status
                AND s2.address_id = a2.address_id
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
---             AND nvl(a2.extension,987988) = nvl(hp.extension,987988)
                AND a2.usps_id = v2.usps_id
                AND v2.city = upper(hp.city)
                AND v2.state = hp.state
                AND v2.zip = hp.zip)
         ORDER BY sponsor_id;
BEGIN
   dbms_output.put_line('LifeTrak to Hemasphere Sponsor Interface '||',' ||
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
      t_skip_flag := 'N';
      t_count := t_count + 1;
---
      IF (a1.term_date = to_date('31-DEC-9999')) THEN
         t_term_date := null;
      ELSE
         t_term_date := a1.term_date;
      END IF;
---
---   Verify Sponsor_id
---
      t_exist := 'N';
      BEGIN
         SELECT 'Y'
           INTO t_exist
           FROM sponsors
          WHERE sponsor_id = a1.sponsor_id;
      EXCEPTION
         WHEN too_many_rows THEN
            t_exist := 'Y';
         WHEN others THEN
            t_exist := 'N';
      END;
---
---   Verify default_location_id
---
      BEGIN
         SELECT 'Y'
           INTO t_loc_id
           FROM locations
          WHERE location_id = a1.default_location_id;
      EXCEPTION
         WHEN others THEN
            t_skip_flag := 'Y';
            dbms_output.put_line ('Undefined location for: '||
                                  a1.sponsor_id||' '||substr(a1.name,1,35));
      END;
---
---   Verify Territory_id
---
      BEGIN
         SELECT territory_id
           INTO t_territory
           FROM valid_territories
          WHERE territory_id = a1.territory_id;
      EXCEPTION
         WHEN others THEN
---         t_skip_flag := 'Y';
            dbms_output.put_line ('Undefined Territory for: ' ||
                                  a1.sponsor_id||' '||substr(a1.name,1,35)||
                                  a1.territory_id);
            t_territory := 'TERRY00022'; 
      END;
---
      t_category := 'CORP';
      t_lob := 'CORPO';
      BEGIN
         SELECT trim(substr(lt_code,1,5))
           INTO t_category
           FROM lt_hs_code_xref
          WHERE code_type = 'SCAT'
            AND hs_desc = a1.category;
      EXCEPTION
         WHEN others THEN
            t_category := 'CORP';
      END;
---
      t_lob := 'CORPO';
      BEGIN
         SELECT trim(substr(lt_code,1,5))
           INTO t_lob
           FROM lt_hs_code_xref
          WHERE code_type = 'LOB'
            AND hs_desc = a1.category;
      EXCEPTION
         WHEN others THEN
            t_lob := 'CORPO';
      END;
---
---   Verify parent sponsor_id
---
      IF (a1.parent_sponsor_id IS NOT NULL ) THEN
         t_parent_id := null;
         BEGIN
            SELECT sponsor_id
              INTO t_parent_id
              FROM sponsors
             WHERE sponsor_id = a1.parent_sponsor_id;
         EXCEPTION
            WHEN others THEN
               t_parent_id := null;
         END;
      ELSE
         t_parent_id := null;
      END IF;
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
            dbms_output.put_line('Invalid city,state,zip for:'||
                                 a1.sponsor_id||' '||substr(a1.name,1,35));
      END;
---
      IF (t_exist = 'N' AND t_skip_flag != 'Y') THEN
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
            INSERT INTO sponsors
               (sponsor_id,chapter_id,name,address_id,territory_id,
                category,status,lob,employee_base,parent_sponsor_id,
                note_id,sponsor_rating,default_location_id,
                old_sponsor_id,conv_sponsor_id,eff_date,
                term_date,program_id,insert_date,insert_user,audit_key)
            VALUES
               (a1.sponsor_id,'WAD',a1.name,
                trim(to_char(v_add_id,'9999999999')),
                t_territory,t_category,a1.status,t_lob,a1.employee_base,
                t_parent_id, null,null,a1.default_location_id,null,null,
                a1.eff_date,t_term_date,'HS_INTRF',a1.insert_date,'DONSYS',
                null);
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line ('Cannot Insert Sponsor: '||
                                     a1.sponsor_id||' '||substr(a1.name,1,35));
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
                  a1.street_name, v_usps_id,a1.street_name_2,
                  null,null,null,a1.extension,null,null,a1.e_mail,null,
                  null,a1.suite_apt,null,a1.area_code,a1.phone_no,null,
                  null,null,null,null,null,null,a1.eff_date,t_term_date,
                  'HS_INTRF',a1.insert_date,'DONSYS');
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line('Cannot Insert new Sponsor Address '||
                              a1.sponsor_id||' '||substr(a1.name,1,35));
---               dbms_output.put_line(substr(sqlerrm,1,78));
            END;
         ELSE
            dbms_output.put_line('Cannot insert new address '||
                                  a1.sponsor_id||' '||substr(a1.name,1,35));
         END IF;
---
      ELSIF (t_exist = 'Y' AND t_skip_flag != 'Y') THEN
         t_update := t_update + 1;
         BEGIN
            UPDATE sponsors
               SET name = a1.name,
                   territory_id = t_territory,
                   eff_date = a1.eff_date,
                   term_date = t_term_date,
                   category = t_category,
                   status = a1.status,
                   lob = t_lob,
                   employee_base = a1.employee_base,
                   parent_sponsor_id = nvl(t_parent_id,parent_sponsor_id),
                   default_location_id = a1.default_location_id
             WHERE sponsor_id = a1.sponsor_id;
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line('cannot update sponsor: '||
                                    a1.sponsor_id||' '||substr(a1.name,1,35));
         END;
---
---   check address_id
---
         BEGIN
            SELECT address_id
              INTO v_address
              FROM sponsors
             WHERE sponsors.sponsor_id=a1.sponsor_id;
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line('address id does not exist'||
                                    a1.sponsor_id||' '||substr(a1.name,1,35));
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
                              a1.sponsor_id||' '||substr(a1.name,1,35));
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
                                 a1.sponsor_id||' '||substr(a1.name,1,35));
                     dbms_output.put_line(substr(sqlerrm,1,78));
               END;
            END IF;
         END IF;
---
      ELSE
         t_skip := t_skip + 1;
      END IF;
---
      IF (t_skip_flag = 'N') THEN
         BEGIN
            UPDATE hp_sponsor
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
   dbms_output.put_line ('End LifeTrak to Hemasphere Sponsor Interface');
   dbms_output.put_line ('============================================');
   dbms_output.put_line ('Interfaced: '||to_char(t_count,'999,999')||
                         ' records');
   dbms_output.put_line ('Inserted:   '||to_char(t_insert,'999,999')||
                         ' records');
   dbms_output.put_line ('Updated:    '||to_char(t_update,'999,999')||
                         ' records');
   dbms_output.put_line ('Skipped:    '||to_char(t_skip,'999,999')||
                         ' records');
END;
/
spool off
exit
/

