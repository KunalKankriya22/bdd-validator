DECLARE
   CURSOR get_attr IS
      SELECT unit_id, coll_date, chapter_id, class, type,
             code, eff_date, term_date,user_id,record_date
        FROM mw_donation_att_inter
      ORDER BY unit_id, code;
   t_trans_id   varchar2(10);
  v_inter_code varchar2(10);
  v_inter_type varchar2(5);
  szUnitId     varchar2(15);
  ltUnit_id    varchar2(15);
 i_count1     number:=0;

BEGIN
dbms_output.enable(1000000);
   FOR a1 IN get_attr LOOP
      --get the correct unit ID
     szUnitId:=a1.unit_id;
      BEGIN
        i_count1 := 0;
        SELECT count(*)
        INTO i_count1
        FROM donations
        WHERE unit_id = szUnitId
        AND coll_date = a1.coll_date
        AND chapter_id = a1.chapter_id;
     EXCEPTION
      WHEN others THEN
        i_count1 := 0;
        szUnitId:=null;
     END;

    ---check if the unit is in the translation table
     If i_count1=0 then
      begin
         select new_unit into ltUnit_id from mw_unit_trans
         where old_unit=szUnitId;
         szUnitId:=ltUnit_id;
      exception
        when others then
          dbms_output.put_line( a1.unit_id||' DONATION not present');
          szUnitId:=null;  
      end;
    End If;
 
    
  If szUnitId is not null then  
    BEGIN
         SELECT transaction_id
           INTO t_trans_id
           FROM donations
          WHERE donations.unit_id = szUnitId
            AND donations.coll_date=a1.coll_date
            AND donations.chapter_id = a1.chapter_id;
      EXCEPTION
         WHEN no_data_found THEN
            dbms_output.put_line ('Error - Unit not found: '||
                                   a1.unit_id||' '||a1.code);
         WHEN others THEN
            dbms_output.put_line ('Error - in finding unit: '||
                                   a1.unit_id||' '||a1.code);
      END;
  End If;
---
       v_inter_type := null;
   BEGIN
       SELECT inter_type,inter_code
        INTO v_inter_type,v_inter_code
        FROM valid_interdictions
        WHERE old_inter = a1.code and
        rownum=1; --sysdate between eff_date and nvl(term_date,sysdate+1);
 EXCEPTION
      when no_data_found then
         Begin
            SELECT inter_type,inter_code
              INTO v_inter_type,v_inter_code
              FROM valid_interdictions
              WHERE inter_code = a1.code and
              rownum=1;
       Exception when others then
           v_inter_type:=null;
       End;
  WHEN others THEN
    v_inter_type := null;
 END;
     
     If v_inter_type is null then 
       dbms_output.put_line('Invalid interdiction-'||a1.code);
      End If;
 
      IF (t_trans_id is not null and v_inter_type is not null) THEN
         BEGIN
            INSERT INTO donation_interdictions VALUES
               (t_trans_id, a1.chapter_id, a1.code,
                v_inter_type,'CONV',null,null,szUnitId,null,a1.term_date,
                null,'BBCS',a1.code,null,'425C',a1.user_id,a1.record_date,
                a1.coll_date,null,audit_seq.nextval);
         EXCEPTION
            WHEN others THEN
               dbms_output.put_line (sqlerrm||'- '||
                                      a1.unit_id||' '||a1.code);
         END;
         COMMIT;
      END IF;
   END LOOP;
   COMMIT;
END;
/
