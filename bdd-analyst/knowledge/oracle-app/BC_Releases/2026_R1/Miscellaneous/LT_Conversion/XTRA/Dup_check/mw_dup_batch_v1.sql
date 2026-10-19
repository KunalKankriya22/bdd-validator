DECLARE
  CURSOR CUR_RDI is
   SELECT ssn,last_name,first_name,date_of_birth,gender,chapter_id from donors
    ORDER BY last_name,first_name,date_of_birth;
---
   i_batch_id       number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   b_recs_commited  boolean;
   n_total           number:=0;
   v_date_time     varchar2(52);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   i_batch_id       :=0;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('Script Name : cs_required_donor_information');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR r_temp in CUR_RDI LOOP
     i_batch_id:=i_batch_id+1;
      n_total:=0;
               
       DON_DUP_DONORS.DUP_DONORS(r_temp.ssn,r_temp.last_name,
                 r_temp.date_of_birth,r_temp.first_name,
                 r_temp.gender,to_char(i_batch_id),3,
                 r_temp.chapter_id,n_total);
       If n_total =1 then 
          delete from mw_donor_reel where session_id=to_char(i_batch_id);
       Else
         Insert into mw_dup_donors (batch_id,donor_id)
            select session_id,donor_id from mw_donor_reel where
             session_id=to_char(i_batch_id);

         delete from mw_donor_reel where session_id=to_char(i_batch_id);
         commit;
       End If;
               
    END LOOP;
END; 
/
