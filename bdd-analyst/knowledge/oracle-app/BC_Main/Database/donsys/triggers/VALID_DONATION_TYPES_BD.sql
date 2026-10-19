--------------------------------------------------------
--  DDL for Trigger VALID_DONATION_TYPES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DONATION_TYPES_BD" 
 BEFORE DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.donation_type,
		:old.chapter_id,
		:old.description,
		:old.test_needed_flag,
		:old.sort_sequence,
		:old.donation_type_group,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DONATION_TYPES_BD" ENABLE;
