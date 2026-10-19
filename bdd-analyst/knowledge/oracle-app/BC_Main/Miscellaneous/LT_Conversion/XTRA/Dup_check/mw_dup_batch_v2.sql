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
   create_flag     varchar2(1);
   next_batch       exception;
   exit_batch       exception;
   batch_count      NUMBER:=0;
   rcount           number:=0;
   nexist           number:=0;
   cursor batch_cur is  select distinct batch_id b_id from  mw_dup_donors;
   cursor dup_donors(pl_batch_id in varchar2) is select
      donor_id,batch_id from mw_dup_donors where batch_id=pl_batch_id; 

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
         begin
          create_flag:='Y';
          FOR i_rec in batch_cur loop
           Begin
                       rcount:=0;
                       for j_rec in dup_donors(i_rec.b_id) loop
                           select nvl(count(*),0) into nexist from
                            mw_donor_reel where donor_id=j_rec.donor_id;
                            if nexist > 0 then 
                               rcount:=rcount+1;
                            end if;
                        end loop;
                        If rcount=n_total then
                          create_flag:='N';
                          raise exit_batch;
                        End If;
             End;
          END LOOP;
         exception when exit_batch then
             null;
         end;

       End If;      
          If create_flag='Y' then                 
            Insert into mw_dup_donors (batch_id,donor_id)
             select session_id,donor_id from mw_donor_reel where
             session_id=to_char(i_batch_id);
          End If;

         delete from mw_donor_reel where session_id=to_char(i_batch_id);
         commit;
                       
    END LOOP;
END; 
/
