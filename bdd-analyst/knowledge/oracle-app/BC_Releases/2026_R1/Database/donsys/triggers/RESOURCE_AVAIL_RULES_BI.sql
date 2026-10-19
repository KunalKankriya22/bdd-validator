--------------------------------------------------------
--  DDL for Trigger RESOURCE_AVAIL_RULES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BI" 
 BEFORE INSERT
 ON RESOURCE_AVAIL_RULES
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into RESOURCE_AVAIL_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		week_day,
		chapter_id,
		max_available,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.resource_code,
		:new.week_day,
		:new.chapter_id,
		:new.max_available,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."RESOURCE_AVAIL_RULES_BI" ENABLE;
