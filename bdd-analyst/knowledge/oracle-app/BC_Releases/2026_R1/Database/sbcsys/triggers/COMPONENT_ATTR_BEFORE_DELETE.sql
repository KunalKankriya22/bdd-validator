--------------------------------------------------------
--  DDL for Trigger COMPONENT_ATTR_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_ATTR_BEFORE_DELETE" 
before delete
on component_attributes
for each row
begin
    insert into component_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		product_code, attrib_group,
		attrib_code, insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user, proc_date
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.product_code, :old.attrib_group,
		:old.attrib_code, :old.insert_dats, :old.insert_user_id,
		:old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid, :new.proc_date
	);
end;
/
ALTER TRIGGER "COMPONENT_ATTR_BEFORE_DELETE" ENABLE;
