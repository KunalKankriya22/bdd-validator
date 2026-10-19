--------------------------------------------------------
--  DDL for Trigger VALID_LIST_TYPES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_LIST_TYPES_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.list_type,
		:new.list_description,
		:new.shelf_life,
		:new.elig_check_reqd,
		:new.max_donors,
		:new.def_proc_code,
		:new.def_don_type,
		:new.enlistment_type,
		:new.default_priority,
		:new.donor_override,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_LIST_TYPES_BU" ENABLE;
