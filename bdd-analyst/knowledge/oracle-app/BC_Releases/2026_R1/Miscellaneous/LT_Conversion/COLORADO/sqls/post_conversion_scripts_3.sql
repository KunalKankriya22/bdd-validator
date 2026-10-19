declare
    nCount  NUMBER:=0;
    szUnit_id   varchar2(15);
    szColl_date   date;
 cursor chagas_donor is select donor_id from donor_interdictions
        where inter_code='CHGN';

begin
   FOR Z in chagas_donor loop
      szUnit_id:=null;
      szColl_date:=null;

     begin
        select unit_id, coll_date into szUnit_id, szColl_date from
        donations where donor_id =Z.donor_id and
        unit_id in (select max(unit_id) from donations where
                    donor_id=Z.donor_id and unit_id is not null);
      
        insert into unit_test_results (UNIT_ID, CHAPTER_ID, TEST_ID,  
                                       RESULT_CODE,PROGRAM_ID,INSERT_DATE,
                                       INSERT_USER,COLL_DATE,COMMENTS)
                         VALUES       (szUnit_id,'PEN','CHAG',
                                      'NR', 'MANUAL',sysdate, 'DONSYS',
                                      szColl_date,Z.donor_id);
     exception when no_data_found then
         null;
     end;


   END LOOP;
end;

