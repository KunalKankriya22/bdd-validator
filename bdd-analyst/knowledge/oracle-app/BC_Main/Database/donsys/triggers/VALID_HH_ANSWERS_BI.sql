--------------------------------------------------------
--  DDL for Trigger VALID_HH_ANSWERS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_ANSWERS_BI" 
 BEFORE INSERT
 ON VALID_HH_ANSWERS
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_HH_ANSWERS' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select LT_USER_SESSION.GET_USERID
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into VALID_HH_ANSWERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		chapter_id,
		question_code,
		answer_code,
		response,
		inter_code,
		deferral_period,
		period_type,
		minimum_period,
		answer_desc,
		eff_date,
		term_date,
		COMMENT_REQ
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.chapter_id,
		:new.question_code,
		:new.answer_code,
		:new.response,
		:new.inter_code,
		:new.deferral_period,
		:new.period_type,
		:new.minimum_period,
		:new.answer_desc,
		:new.eff_date,
		:new.term_date,
		:new.COMMENT_REQ
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_ANSWERS_BI" ENABLE;
