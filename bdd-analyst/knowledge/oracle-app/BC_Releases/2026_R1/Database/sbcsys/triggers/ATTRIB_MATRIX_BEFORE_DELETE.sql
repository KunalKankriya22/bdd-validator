--------------------------------------------------------
--  DDL for Trigger ATTRIB_MATRIX_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "ATTRIB_MATRIX_BEFORE_DELETE" 
before delete
on "ATTRIBUTE_MATRIX"
for each row
begin
	insert into attribute_matrix_audit
	(
		attrib_added_group,
		attrib_added_code,
		attrib_deleted_group,
		attrib_deleted_code,
		associated_attrib_group,
		associated_attrib_code,
		eff_date,
		term_date,
		last_modified_date,
		audit_key,
		program_id,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:old.attrib_added_group,
		:old.attrib_added_code,
		:old.attrib_deleted_group,
		:old.attrib_deleted_code,
		:old.associated_attrib_group,
		:old.associated_attrib_code,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		:old.audit_key,
		'DELETE',
		sysdate,
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "ATTRIB_MATRIX_BEFORE_DELETE" ENABLE;
