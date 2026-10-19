--------------------------------------------------------
--  DDL for Trigger PHYSICAL_FINDINGS_TEMPLATE_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."PHYSICAL_FINDINGS_TEMPLATE_BI" 
 BEFORE INSERT
 ON PHYSICAL_FINDINGS_TEMPLATE
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
    insert into PHY_FINDINGS_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		template_id,
		chapter_id,
		donation_type,
		physical_code,
		procedure_code,
		sort_sequence,
		data_type,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.template_id,
		:new.chapter_id,
		:new.donation_type,
		:new.physical_code,
		:new.procedure_code,
		:new.sort_sequence,
		:new.data_type,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."PHYSICAL_FINDINGS_TEMPLATE_BI" ENABLE;
