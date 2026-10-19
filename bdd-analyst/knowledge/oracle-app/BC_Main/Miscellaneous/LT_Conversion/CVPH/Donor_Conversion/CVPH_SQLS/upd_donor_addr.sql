DECLARE
   CURSOR get_city_state_zip IS
      SELECT rtrim(ltrim(city)) city,
             rtrim(ltrim(state)) state,
             rtrim(ltrim(substr(zip_code,1,5))) zip,
             rowid
        FROM mw_donor_address_information
       WHERE EXISTS
             (SELECT 'x' from valid_city_state
               WHERE valid_city_state.city = 
                     rtrim(ltrim(mw_donor_address_information.city))
                 AND valid_city_state.state =
                     rtrim(ltrim(mw_donor_address_information.state))
                 AND valid_city_state.zip =
                     rtrim(ltrim(substr(mw_donor_address_information.zip_code,1,5))));
---
   CURSOR get_city_zip IS
      SELECT rtrim(ltrim(city)) city,
             rtrim(ltrim(substr(zip_code,1,5))) zip,
             rowid
        FROM mw_donor_address_information
       WHERE EXISTS
             (SELECT 'x' from valid_city_state
               WHERE valid_city_state.city = 
                     rtrim(ltrim(mw_donor_address_information.city))
                 AND valid_city_state.zip =
                     rtrim(ltrim(substr(mw_donor_address_information.zip_code,1,5))))
         AND usps_id IS NULL;
---
   CURSOR get_city_state IS
      SELECT rtrim(ltrim(city)) city,
             rtrim(ltrim(state)) state,
             rowid
        FROM mw_donor_address_information
       WHERE EXISTS
             (SELECT 'x' from valid_city_state
               WHERE valid_city_state.city = 
                     rtrim(ltrim(mw_donor_address_information.city))
                 AND valid_city_state.state =
                     rtrim(ltrim(mw_donor_address_information.state)))
         AND usps_id IS NULL;
---
   CURSOR get_state_zip IS
      SELECT rtrim(ltrim(state)) state,
             rtrim(ltrim(substr(zip_code,1,5))) zip,
             rowid
        FROM mw_donor_address_information
       WHERE EXISTS
             (SELECT 'x' from valid_city_state
               WHERE valid_city_state.state =
                     rtrim(ltrim(mw_donor_address_information.state))
                 AND valid_city_state.zip =
                     rtrim(ltrim(substr(mw_donor_address_information.zip_code,1,5))))
         AND usps_id IS NULL;
---
   CURSOR get_zip IS
      SELECT rtrim(ltrim(substr(zip_code,1,5))) zip,
             rowid
        FROM mw_donor_address_information
       WHERE EXISTS
             (SELECT 'x' from valid_city_state
               WHERE valid_city_state.zip =
                     rtrim(ltrim(substr(mw_donor_address_information.zip_code,1,5))))
         AND usps_id IS NULL;
---
BEGIN
   FOR a1 IN get_city_state_zip LOOP
      UPDATE mw_donor_address_information
         SET usps_id = 
             (SELECT usps_id from valid_city_state
               WHERE valid_city_state.city = a1.city
                 AND valid_city_state.state = a1.state
                 AND valid_city_state.zip = a1.zip
                 AND sysdate BETWEEN valid_city_state.eff_date and 
                                     nvl(valid_city_state.term_date, sysdate+1)
                 AND ROWNUM < 2)
       WHERE rowid = a1.rowid;
      COMMIT;
   END LOOP;
---
   FOR b1 IN get_city_zip LOOP
      UPDATE mw_donor_address_information
         SET usps_id = 
             (SELECT usps_id from valid_city_state
               WHERE valid_city_state.city = b1.city
                 AND valid_city_state.zip = b1.zip
                 AND sysdate BETWEEN valid_city_state.eff_date and 
                                     nvl(valid_city_state.term_date, sysdate+1)
                 AND ROWNUM < 2)
       WHERE rowid = b1.rowid;
      COMMIT;
   END LOOP;
---
   FOR c1 IN get_city_state LOOP
      UPDATE mw_donor_address_information
         SET usps_id = 
             (SELECT usps_id from valid_city_state
               WHERE valid_city_state.city = c1.city
                 AND valid_city_state.state = c1.state
                 AND sysdate BETWEEN valid_city_state.eff_date and 
                                     nvl(valid_city_state.term_date, sysdate+1)
                 AND ROWNUM < 2)
       WHERE rowid = c1.rowid;
      COMMIT;
   END LOOP;
---
   FOR d1 IN get_state_zip LOOP
      UPDATE mw_donor_address_information
         SET usps_id = 
             (SELECT usps_id from valid_city_state
               WHERE valid_city_state.state = d1.state
                 AND valid_city_state.zip = d1.zip
                 AND sysdate BETWEEN valid_city_state.eff_date and 
                                     nvl(valid_city_state.term_date, sysdate+1)
                 AND ROWNUM < 2)
       WHERE rowid = d1.rowid;
      COMMIT;
   END LOOP;
---
   FOR e1 IN get_zip LOOP
      UPDATE mw_donor_address_information
         SET usps_id = 
             (SELECT usps_id from valid_city_state
               WHERE valid_city_state.zip = e1.zip
                 AND sysdate BETWEEN valid_city_state.eff_date and 
                                     nvl(valid_city_state.term_date, sysdate+1)
                 AND ROWNUM < 2)
       WHERE rowid = e1.rowid;
      COMMIT;
   END LOOP;
---
   UPDATE mw_donor_address_information 
      SET usps_id = '000000'
    WHERE usps_id IS NULL;
   COMMIT;
END;
/
