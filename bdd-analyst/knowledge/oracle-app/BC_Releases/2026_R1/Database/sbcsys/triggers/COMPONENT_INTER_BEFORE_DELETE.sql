--------------------------------------------------------
--  DDL for Trigger COMPONENT_INTER_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_INTER_BEFORE_DELETE" 
before delete
on component_interdictions
for each row
begin
    insert into component_interdictions_audit
	(
		unit_id, coll_date, chapter_id,
		product_code, inter_code,
		insert_dats, inter_user_id,
		audit_key,program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.product_code, :old.inter_code,
		:old.insert_dats, :old.inter_user_id,
		:old.audit_key,'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "COMPONENT_INTER_BEFORE_DELETE" ENABLE;
