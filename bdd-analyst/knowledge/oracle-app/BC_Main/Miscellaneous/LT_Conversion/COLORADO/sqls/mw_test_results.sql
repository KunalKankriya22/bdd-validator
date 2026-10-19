DECLARE
   CURSOR CUR_DA is
      SELECT DONOR_ID, CHAPTER_ID, UNIT_ID, COLL_DATE,
             TEST_TYPE, TEST_ID,nvl(TEST_RESULT,'NT') RESULT_CODE,
             user_id,record_date, 
             rownum FROM mw_test_results
       WHERE test_id is not null
      ORDER BY donor_id, coll_date, test_id;
---
   i_count          number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   b_recs_commited  boolean;
   b_run_status     boolean;
   v_date_time      varchar2(20);
   b_rec_status     boolean;
   v_program_id     VARCHAR2(8);
   i_commit_recs    number;
   v_insert_user    VARCHAR2(6);
   i_audit_key      number;
   t_donor_id       VARCHAR2(10);
   dActColl         DATE;
   dCollDate        Date;
   nCount           NUMBER:=0;
   i_no_donation    NUMBER:=0;
   i_no_donor       NUMBER:=0;
   szTest           VARCHAR2(20);
   szResult         VARCHAR2(20);
   szAltRes         VARCHAR2(20);
   i_dup_count      NUMBER:=0; 
   szUnit_id        VARCHAR2(15);
   x_test           varchar2(10);
   szAbsorbance     varchar2(12); 
Procedure place_interdiction (v_donor in varchar2,v_test in varchar2,
                                 v_result in varchar2,v_eff_date in date) is
      i_audit_key   NUMBER:=0;
      v_inter       VARCHAR2(10);
      v_inter_type  VARCHAR2(10);
       Icount       NUMBER:=0; 
   Begin
        Begin
           select AUDIT_SEQ.nextval into i_audit_key from dual;
          Exception when others then
            i_audit_key:=0;
         End;

        v_inter:=null;
        Begin
          select inter_code into v_inter from valid_test_results_don
          where test_id=v_test and result_code=v_result and 
          rownum=1;
        Exception when others then
           v_inter:=null;
        End;

      IF v_inter is not null then 
          v_inter_type := null;
          Begin
               SELECT inter_type INTO v_inter_type FROM valid_interdictions
               WHERE inter_code = v_inter;
         Exception WHEN others THEN
              v_inter_type :='INTER';
         End;  

         Begin
              select nvl(count(*),0) into Icount from donor_interdictions where 
              donor_id=v_donor and inter_code=v_inter and
              inter_type=v_inter_type ; --and eff_date=v_eff_date;

           If Icount= 0 then  
              INSERT into donor_interdictions
                  (donor_id,chapter_id,inter_code,eff_date,
                   inter_type,term_date, program_id, insert_date,
                   insert_user, audit_key)
              VALUES
                   (v_donor, 'ALL',v_inter,v_eff_date, v_inter_type, null,
                    v_program_id, trunc(sysdate), v_insert_user,
                    audit_seq.nextval);
          End If;
 
         End;
      END IF;
   End place_interdiction;

BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '427P';
   i_commit_recs    := 200;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('Script Name : cs_unit_test_results');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR r_temp_rec in CUR_DA LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Verify that all required fields have non-null values.
---
      BEGIN
         IF (r_temp_rec.donor_id is null) THEN
             dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                                  r_temp_rec.rownum||' DONOR_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.chapter_id is null) THEN
             dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                                  r_temp_rec.rownum||' CHAPTER_ID is null');
             b_rec_status := FALSE;
         END IF;
---
---
         IF (r_temp_rec.result_code is null) THEN
             dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                                  r_temp_rec.rownum||' result is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.unit_id is null) THEN
             dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                                  r_temp_rec.rownum||' unit_id is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.coll_date is null) THEN
             dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                                  r_temp_rec.rownum||' coll_date is null');
             b_rec_status := FALSE;
         END IF;
---
      EXCEPTION
         WHEN OTHERS THEN
              dbms_output.put_line('Error Occured in Step 1!'||
                                   ' Oracle Error Code : '||to_char(sqlcode));
              b_rec_status := FALSE;
      END; -- step 1
---
---   STEP 3: Verify that validation fields have valid values
---
   /*
      IF (b_rec_status = TRUE) THEN

          Begin
             select lt_test_id into szTest from 
             x_test_id where ll_test_id= LTrim(RTrim(r_temp_rec.test_id));
          Exception when others then
            dbms_output.put_line('Test ID is missing in Translation table');
            b_rec_status:=FALSE;
          End;
      END IF; */

      szTest:=LTrim(Rtrim(r_temp_rec.test_id));

      IF (b_rec_status = TRUE) THEN
          BEGIN
             i_count1 := 0;
             SELECT count(*) INTO i_count1 FROM valid_tests_don
                WHERE test_id = szTest; --  AND 
                --sysdate between eff_date and nvl(term_date, sysdate+1);
          EXCEPTION
               WHEN others THEN
                  i_count1 := 0;
          END;

            IF (i_count1 = 0) THEN
               begin
                select lt_test_id into x_test from x_testing
                where bbcs_test_id=szTest;
                szTest:=x_test;
               exception when no_data_found then 
                  dbms_output.put_line('MW_UNIT_TEST_RESULTS'||' '||
                             r_temp_rec.rownum||' invalid test id-'||szTest);
                  b_rec_status := FALSE;
               end;

            END IF;
     END IF;

    szAbsorbance:=null;
  IF (b_rec_status = TRUE) THEN

    If szTest='ABORH' then
       if r_temp_rec.result_code='UNK' then 
          szResult:=null; ---'NT';  --this should be verified witht he customer
       else
         szResult:=ltrim(r_temp_rec.result_code);
       end if;
 
       select decode(ltrim(r_temp_rec.result_code) ,'O +','51','OPOS','51',
                   'O POS','51','OP','51',
                   'AP','62','A POS','62','A+','62','APOS','62','A +','62',
                   'A +*','62',
                   'BP','73','B+','73','B +','73','B POS','73','BPOS','73',
                   'B +*','73',
                   'ABP','84','AB+','84','ABPOS','84','AB +','84','AB POS','84',
                   'AB +*','84',
                   'ON','95','O-','95','O -','95','ONEG','95','O NEG','95',
                   'O +*','95',
                   'AN','06','A-','06','A -','06','A NEG','06','ANEG','06',
                   'A -*','06',
                   'BN','17','B-','17','B -','17','BNEG','17','B NEG','17',
                   'B -*','17',
                   'ABN','28','AB-','28','ABNEG','28','AB NEG','28','AB -','28',
                   'AB -*','28',r_temp_rec.result_code) into szResult from dual;
      
      null;
   Elsif szTest in ('ALT' ,'CHOL') then

       If r_temp_rec.result_code = 'ND' then 
          szResult:='NT';
       Else
           szResult:='TD';
       End If;
       szAbsorbance:=r_temp_rec.result_code;
   Else
      If Ltrim(RTrim(r_temp_rec.result_code)) in ('+','P','POS','R') then
        szResult:='P';
      Elsif LTrim(RTrim(r_temp_rec.result_code)) in ('-','NEG','N','NR') then
         szResult:='N';
      Else
         szResult:=r_temp_rec.result_code;
      End If;
   End If;
   
---
--- Check test result 
---
           
         BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM valid_test_results_don
                WHERE test_id =szTest
                  AND result_code = szResult;
            
            IF i_count1 = 0 then
                  szAltRes:=SzResult;
               If szResult='N' then 
                  select count(*) into i_count1 from valid_test_results_don
                  where test_id=szTest and result_code='NR';
                  if i_count1> 0 then
                    szAltRes:='NR';
                  else
                     select count(*) into i_count1 from valid_test_results_don
                     where test_id=szTest and result_code='NEG';
                      if i_count1>0 then 
                        szAltRes:='NEG';
                      end if;
                  end if;
               ElsIf szResult='NR' then 
                  select count(*) into i_count1 from valid_test_results_don
                  where test_id=szTest and result_code='N';
                  if i_count1> 0 then 
                    szAltRes:='N';
                   else
                     select count(*) into i_count1 from valid_test_results_don
                     where test_id=szTest and result_code='NEG';
                     if i_count1>0 then
                        szAltRes:='NEG';
                      end if;
                  end if;
               ElsIf szResult='P' then 
                  select count(*) into i_count1 from valid_test_results_don
                  where test_id=szTest and result_code='R';
                  if i_count1 > 0 then 
                    szAltRes:='R';
                  else
                    select count(*) into i_count1 from valid_test_results_don
                    where test_id=szTest and result_code='POS';
                    if i_count1>0 then
                       szAltRes:='POS';
                    end if; 
                  end if;
               ElsIf szResult='R' then 
                  select count(*) into i_count1 from valid_test_results_don
                  where test_id=szTest and result_code='P';
                  if i_count1> 0 then 
                    szAltRes:='P';
                  else  
                    select count(*) into i_count1 from valid_test_results_don
                    where test_id=szTest and result_code='POS';
                    if i_count1>0 then
                       szAltRes:='POS';
                    end if;
                  end if;
               End If;
               szResult:=szAltRes; 
           End If;

            IF (i_count1 = 0) THEN
                dbms_output.put_line('Test='||szTest||' '||
                             szResult||' Invalid test result');
                b_rec_status := FALSE;
            END IF;
        END;
   END IF;
---
---   Verify that donor exists in the Donor file.
---
/*  
    BEGIN
         t_donor_id := null;
         SELECT donor_id
           INTO t_donor_id
           FROM DONORS
          WHERE donors.donor_id = r_temp_rec.donor_id;
      EXCEPTION
         WHEN no_data_found THEN
            t_donor_id := null;
         WHEN others THEN
            dbms_output.put_line('Error in finding donor!'||
                       ' Donor: '||r_temp_rec.donor_id);
            b_rec_status := FALSE;
            t_donor_id := null;
           i_no_donor:=i_no_donor+1;
      END;
---
      IF (t_donor_id is null) THEN
                dbms_output.put_line('No donor record. '||' '||
                             r_temp_rec.rownum||' No insert.');
                b_rec_status := FALSE;
      END IF;

*/
---
---   Verify that donation exists in the Donation file.
---
      BEGIN
         t_donor_id := null;
         dActColl:=null;
         dCollDate:=null;
         szUnit_id:=null;

         SELECT donor_id,coll_date
           INTO t_donor_id,dCollDate
           FROM DONATIONS
          WHERE donations.unit_id = r_temp_rec.unit_id and
              rownum <2;

          If trunc(dCollDate)!=r_temp_rec.coll_date then
             dActColl:=dCollDate;
          Else
             dActColl:=r_temp_rec.coll_date;
          End If;

      EXCEPTION
         WHEN no_data_found THEN
             begin
               select new_unit into szUnit_id from mw_unit_trans
               where old_unit=r_temp_rec.unit_id;
               dActColl:=r_temp_rec.coll_date;

             exception when others then 
                   --dbms_output.put_line('Error in finding donation!'||
                   --      ' Unit ID: '||r_temp_rec.unit_id);
                   insert into missing_units values (r_temp_rec.unit_id,
                                     r_temp_rec.coll_date,v_program_id);
                  b_rec_status := FALSE;
                  i_no_donation:=i_no_donation+1;
             end;

      END;
---
---    Insert record in test result table
---
      IF (b_rec_status = TRUE) THEN
---
---     Verify that record does not already exist in the unit_test_results table
---
        if szUnit_id is null then 
           szUnit_id:=r_temp_rec.unit_id;
        end if;
       
         BEGIN
               SELECT nvl(count(*),0) into nCount 
                 FROM unit_test_results
                WHERE unit_test_results.unit_id = szUnit_id
                  AND unit_test_results.chapter_id = r_temp_rec.chapter_id
                 --AND unit_test_results.coll_date = dActColl
                  AND unit_test_results.test_id = szTest
                  AND unit_test_results.result_code=szResult;
---
            IF nCount = 0 then 
               INSERT INTO unit_test_results VALUES
                  (szUnit_id, r_temp_rec.chapter_id,
                   szTest, szResult, 
                   szAbsorbance,null,null, null,null,null,
                   null,null,null, null,null,null,
                   v_program_id, sysdate,
                   'CONV', dActColl);  
                 If szResult in ('P','R','E','NT') then
                    place_interdiction(r_temp_rec.donor_id,szTest,
                                       szResult,dActColl);
                 End If;

            ELSE
                --dbms_output.put_line('test already exists. '||' '||
                -- r_temp_rec.unit_id||' '||to_char(dActColl,'mm-dd-yy'));
                i_dup_count:=i_dup_count+1;
                b_rec_status := FALSE;
            END IF;
---
---    Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (i_rec_count mod i_commit_recs = 0) THEN
               COMMIT;
               b_recs_commited := TRUE;
               i_rec_count :=0;
            END IF;
         EXCEPTION
             WHEN OTHERS THEN
               if sqlerrm like 'ORA-00001%' then 
                  null;
               else
                 dbms_output.put_line('Error Occured in Step 4!'||
                     ' Oracle Error : '||r_temp_rec.unit_id||' '||sqlerrm);
               end if;

         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Test Results : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Test Results : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('No Donation : '||
                          to_char(i_no_donation));
    dbms_output.put_line('No Donor '||
                          to_char(i_no_donor));
    dbms_output.put_line('Duplicate Records '||
                          to_char(i_dup_count));
   dbms_output.put_line('Script End Time : '||v_date_time);
END;
/
