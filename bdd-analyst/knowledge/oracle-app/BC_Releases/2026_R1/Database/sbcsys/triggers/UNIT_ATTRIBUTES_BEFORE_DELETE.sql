--------------------------------------------------------
--  DDL for Trigger UNIT_ATTRIBUTES_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_ATTRIBUTES_BEFORE_DELETE" 
before delete
on unit_attributes
for each row
begin
    insert into unit_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		attrib_group, attrib_code, source_test_id,
		status_flag, stop_label_flag,
		insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.attrib_group, :old.attrib_code, :old.source_test_id,
		:old.status_flag, :old.stop_label_flag,
		:old.insert_dats, :old.insert_user_id,
		:old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "UNIT_ATTRIBUTES_BEFORE_DELETE" ENABLE;
