spool &1;
SET serveroutput on;
SET heading off;
SELECT 'Interface Applicable Donor Deferrals from LT/Donor to LT/Distribution' from dual;
DECLARE
   statement      VARCHAR2(40);
   temp_unit      VARCHAR2(15);
   temp_date      DATE;
   temp_prod      NUMBER := 0;
   temp_add       NUMBER := 0;
   temp_updt      NUMBER := 0;
   temp_del       NUMBER := 0;
   c_unit_id      VARCHAR2(15);
   c_coll_date    DATE;
   c_chapter_id   VARCHAR2(4);
   update_flag    VARCHAR2(1);
   CURSOR get_inv_units IS
      SELECT distinct chapter_id, unit_id, coll_date
        FROM active_products
      UNION
      SELECT distinct chapter_id, unit_id, coll_date
        FROM components
       WHERE insert_dats > sysdate - 42
         AND component_status = 'L'
         AND reject_reason_code is null
      UNION
      SELECT distinct chapter_id, unit_id, coll_date
        FROM return_items
       WHERE move_date is null; 

   CURSOR get_cur_holds IS
      SELECT d.inter_code, d.term_date
        FROM donor_interdictions d, valid_interdictions v, donations u
       WHERE u.unit_id = c_unit_id
         AND u.coll_date = c_coll_date
         AND u.chapter_id = c_chapter_id
         AND u.donor_id = d.donor_id
         AND d.release_date is null
         AND d.inter_code = v.inter_code
         AND sysdate between v.eff_date and nvl(v.term_date, sysdate+1)
         AND u.coll_date <= nvl(d.term_date, sysdate+1)
         AND nvl(d.unit_id, '0') =
                DECODE (v.lab_hold_flag,
                   null, '-1',
                   'N', '-1',
                   'C', c_unit_id,
                   'Q', c_unit_id,
                   'A', nvl(d.unit_id, '0'), 
                   'H', nvl(d.unit_id, '0'), 
                   'I', decode(least(u.coll_date, nvl(d.eff_date,
                                  d.insert_date)-1), u.coll_date,  '-1',
                        decode(greatest(u.coll_date, nvl(d.term_date,
                     sysdate+1)), u.coll_date, '-1', nvl(d.unit_id, '0'))),
                   '-1')
      UNION
      SELECT d.inter_code, d.term_date
        FROM donation_interdictions d, valid_interdictions v
       WHERE d.unit_id = c_unit_id
         AND d.coll_date = c_coll_date
         AND d.chapter_id = c_chapter_id
         AND d.inter_code = v.inter_code
         AND d.release_date is null
         AND sysdate between v.eff_date and nvl(v.term_date, sysdate+1)
         AND d.term_date is null
         AND v.lab_hold_flag in ('A','C','I');

   CURSOR get_exp_holds IS
      SELECT chapter_id,unit_id,coll_date
        FROM ddr_units
       WHERE modify_date < temp_date;
BEGIN
   dbms_output.enable(200000);
   temp_date := sysdate;
   dbms_output.put_line('* Interface Starts: '
      ||to_char(temp_date,'mm/dd/yy hh24:mi:ss'));
   dbms_output.put_line('*');
   --
   statement := 'Fetch products';
   FOR cur_unit IN get_inv_units LOOP
      BEGIN
         temp_prod := temp_prod + 1;
         temp_unit := cur_unit.unit_id;
         statement := 'Get donor ID';
         c_unit_id := cur_unit.unit_id;
         c_coll_date := cur_unit.coll_date;
         c_chapter_id := cur_unit.chapter_id;
         update_flag := null;
         --
         statement := 'Fetch assertions';
         FOR don_hold IN get_cur_holds LOOP
            IF (nvl(update_flag , 'N') != 'Y') THEN
               BEGIN
                  statement := 'Insert';
                  INSERT INTO ddr_units
                       (chapter_id, unit_id, coll_date, modify_date)
                  VALUES
                       (c_chapter_id, c_unit_id, c_coll_date, sysdate);
                  temp_add := temp_add + 1;
                  update_flag := 'Y';
               EXCEPTION
                  WHEN DUP_VAL_ON_INDEX THEN
                     statement := 'Update';
                     UPDATE ddr_units
                        SET modify_date = sysdate
                      WHERE chapter_id = cur_unit.chapter_id
                        AND unit_id = cur_unit.unit_id
                        AND coll_date = cur_unit.coll_date;
                     temp_updt := temp_updt + 1;
                     update_flag := 'Y';
               END;
            END IF;
         END LOOP;
      EXCEPTION
         WHEN no_data_found THEN
              null;
      END;
   END LOOP;
   --
   statement := 'Fetch Old Units';
   FOR exp_holds IN get_exp_holds LOOP
      statement := 'Deletion';
      DELETE FROM ddr_units
       WHERE chapter_id = exp_holds.chapter_id
         AND unit_id = exp_holds.unit_id
         AND coll_date = exp_holds.coll_date;
      temp_del := temp_del + 1;
   END LOOP;
   statement := 'Commit';
   commit;
   dbms_output.put_line('* Commit performed');
   dbms_output.put_line('*');
   dbms_output.put_line('* Interface Ends  : '
      ||to_char(sysdate,'mm/dd/yy hh24:mi:ss'));
   dbms_output.put_line('*');
   dbms_output.put_line('*     '||to_char(temp_prod)||'   units checked.');
   dbms_output.put_line('*     '||to_char(temp_add) ||'   units added.');
   dbms_output.put_line('*     '||to_char(temp_updt)||'   units confirmed.');
   dbms_output.put_line('*     '||to_char(temp_del) ||'   units deleted.');
exception
   WHEN OTHERS THEN
      commit;
      dbms_output.put_line('* Interface Aborts: '
         ||to_char(sysdate,'mm/dd/yy hh24:mi:ss'));
      dbms_output.put_line('* ');
      dbms_output.put_line('*     Error    : '||SQLERRM);
      dbms_output.put_line('*     Statement: '||statement);
      dbms_output.put_line('*     Unit     : '||temp_unit);
END;
/
spool off;
exit;
