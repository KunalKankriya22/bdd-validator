--------------------------------------------------------
--  DDL for Trigger VALID_LIST_TYPES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_LIST_TYPES_BD" 
 BEFORE DELETE
 ON VALID_LIST_TYPES
 FOR EACH ROW
BEGIN
    insert into VALID_LIST_TYPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		list_type,
		list_description,
		shelf_life,
		elig_check_reqd,
		max_donors,
		def_proc_code,
		def_don_type,
		enlistment_type,
		default_priority,
		donor_override,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.list_type,
		:old.list_description,
		:old.shelf_life,
		:old.elig_check_reqd,
		:old.max_donors,
		:old.def_proc_code,
		:old.def_don_type,
		:old.enlistment_type,
		:old.default_priority,
		:old.donor_override,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_LIST_TYPES_BD" ENABLE;
