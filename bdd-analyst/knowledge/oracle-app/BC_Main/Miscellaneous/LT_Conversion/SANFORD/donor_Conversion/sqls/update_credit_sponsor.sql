DECLARE
 CURSOR CUR_LEN6 is
    SELECT unit_id,sponsor_id,coll_date,rownum FROM mw_donations;

ltUnit_id   VARCHAR2(15);
t_machine  VARCHAR2(2);
commit_count NUMBER:=0;

BEGIN

   FOR currec in CUR_LEN6 LOOP
          update donations set credit_sponsor=currec.sponsor_id
          where unit_id=currec.unit_id and coll_date=currec.coll_date;
          commit_count:=commit_count+1;
     
          If commit_count >=100 then 
            commit;
            commit_count:=0;
          End If;
   END LOOP;
   commit;
END;
/


