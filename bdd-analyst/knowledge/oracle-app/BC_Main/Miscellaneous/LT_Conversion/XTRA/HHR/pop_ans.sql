DECLARE
 cursor drug_cur is select * from mdw_valid_hh_answers;
BEGIN
 dbms_output.enable(1000000);
  FOR d_rec in drug_cur loop
   begin 
    Insert into valid_hh_answers values(
                RTrim(LTrim(d_rec.question_code)),
               'WAD',
               RTrim(LTrim(d_rec.answer_code)),
               rtrim(ltrim(d_rec.response)),
               RTrim(LTrim(d_rec.inter_code)),
               to_number(LTrim(d_rec.deferral_period)),
               LTrim(d_rec.period_type),
               to_number(ltrim(rtrim(d_rec.minimum_period))),
               RTrim(LTrim(d_rec.answer_desc)),
               sysdate,
               null,
               'MDW_CONV',
               sysdate,
              'DONSYS',
              audit_seq.nextval);
  
  exception when others then
     dbms_output.put_line(d_rec.question_code||'  '||d_rec.answer_code||
                         '      -'|| substr(sqlerrm,1,50));
  end;
END LOOP;
commit;
END;
 
