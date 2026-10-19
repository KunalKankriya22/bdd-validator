--------------------------------------------------------
--  DDL for Trigger VALID_PROC_CODES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PROC_CODES_BU" 
 BEFORE UPDATE
 ON VALID_PROC_CODES
 FOR EACH ROW
BEGIN
	insert into VALID_PROC_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		procedure_code,
		chapter_id,
		description,
		duration,
		credit_count,
		sort_sequence,
		sch_view_interval,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.procedure_code,
		:new.chapter_id,
		:new.description,
		:new.duration,
		:new.credit_count,
		:new.sort_sequence,
		:new.sch_view_interval,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PROC_CODES_BU" ENABLE;
