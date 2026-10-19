--------------------------------------------------------
--  DDL for Trigger VALID_HH_QUESTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BI" 
 BEFORE INSERT
 ON VALID_HH_QUESTIONS
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_HH_QUESTIONS' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into VALID_HH_QUESTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		question_code,
		chapter_id,
		gender,
		question_description,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.question_code,
		:new.chapter_id,
		:new.gender,
		:new.question_description,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_QUESTIONS_BI" ENABLE;
