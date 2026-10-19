DECLARE
 CURSOR CUR_LEN6 is
    SELECT unit_id,rownum FROM mw_test_results where
     Length(Unit_id)=6 and substr(Unit_id,1,1) in
         ('G','F','E','C','H','J','K','L','M','N','P','Q','R','S','T',
          'V','W','X','Y','Z') and
          ltrim(substr(Unit_id,2),'0987654321') is null
     for update of unit_id;

 CURSOR CUR_LEN7 is
    SELECT unit_id,rownum FROM mw_test_results where
    Length(Unit_id) = 7 and substr(Unit_id,1,1) in
             ('G','F','E','C','H','J','K','L',
             'M','N','P','Q','R','S','T', 'V','W','X','Y','Z') and
   substr(Unit_id,2,1)=' ' for update of unit_id;


ltUnit_id   VARCHAR2(15);
t_machine  VARCHAR2(2);
commit_count NUMBER:=0;

BEGIN

   FOR currec in CUR_LEN6 LOOP
          ltUnit_id:=' '||currec.unit_id;
          update mw_test_results set unit_id=ltUnit_id where
          current of CUR_LEN6;
          commit_count:=commit_count+1;
     
          If commit_count >=100 then 
            commit;
            commit_count:=0;
          End If;
   END LOOP;
   commit;
   commit_count:=0;
   ltUnit_id:=null;

  FOR Z1 in CUR_LEN7 LOOP
       --get the machine code value from the bar ode prefixes table
       begin
         select machine_code into t_machine from bar_code_prefixes
         where eye_read_trns=' '||substr(Z1.unit_id,1,1);

          ltUnit_id:=t_machine||substr(Z1.unit_id,3,5);
      exception when no_data_found then
         null;
      end;

      update mw_test_results set unit_id=ltUnit_id where
      current of CUR_LEN7;
     
      commit_count:=commit_count+1;

      If commit_count >=1000 then
         commit;
         commit_count:=0;
      End If;

END LOOP;
COMMIT;

END;
/


