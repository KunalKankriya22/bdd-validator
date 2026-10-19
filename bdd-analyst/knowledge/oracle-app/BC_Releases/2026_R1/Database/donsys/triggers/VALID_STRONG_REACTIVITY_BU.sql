--------------------------------------------------------
--  DDL for Trigger VALID_STRONG_REACTIVITY_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_STRONG_REACTIVITY_BU" 
 BEFORE UPDATE
 ON VALID_STRONG_REACTIVITY
 FOR EACH ROW
BEGIN
	insert into VALID_STRONG_REACTIVITY_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		epitope_id_1,
		epitope_id_2,
		chapter_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.epitope_id_1,
		:new.epitope_id_2,
		:new.chapter_id,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_STRONG_REACTIVITY_BU" ENABLE;
