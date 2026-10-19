--------------------------------------------------------
--  DDL for Trigger COMPONENT_CGMP_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_CGMP_BEFORE_DELETE" 
before delete
on component_cgmp
for each row
begin
    insert into component_cgmp_audit
	(
     unit_id, coll_date, chapter_id, product_code, aliquot,
    parm_code, parm_value, equip_reference, process_dats, insert_dats,
    insert_user, audit_key, program_id, audit_insert_dats,
    audit_insert_user
	)
	values
	(
     :old.unit_id, :old.coll_date, :old.chapter_id, :old.product_code,
     :old.aliquot, :old.parm_code, :old.parm_value,
     :old.equip_reference, :old.process_dats, :old.insert_dats,
      :old.insert_user, :old.audit_key, 'DELETE',
      sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "COMPONENT_CGMP_BEFORE_DELETE" ENABLE;
