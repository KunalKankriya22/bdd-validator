--------------------------------------------------------
--  DDL for Trigger VALID_DONATION_TYPES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DONATION_TYPES_BU" 
 BEFORE UPDATE
 ON VALID_DONATION_TYPES
 FOR EACH ROW
BEGIN
	insert into VALID_DONATION_TYPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		donation_type,
		chapter_id,
		description,
		test_needed_flag,
		sort_sequence,
		donation_type_group,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.donation_type,
		:new.chapter_id,
		:new.description,
		:new.test_needed_flag,
		:new.sort_sequence,
		:new.donation_type_group,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DONATION_TYPES_BU" ENABLE;
