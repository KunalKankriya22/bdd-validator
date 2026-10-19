--------------------------------------------------------
--  DDL for Trigger VALID_HH_ANSWERS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "VALID_HH_ANSWERS_BI" 
 BEFORE INSERT
 ON VALID_HH_ANSWERS
 FOR EACH ROW
DECLARE
	temp_audit_key    number(23);
begin
    if :new.insert_user is null then
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
        into :new.insert_user from dual ;
    end if;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
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
		term_date
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
		:new.term_date
	);
end;
/
ALTER TRIGGER "VALID_HH_ANSWERS_BI" ENABLE;
