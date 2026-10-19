--------------------------------------------------------
--  DDL for Trigger COMPONENT_CGMP_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_CGMP_BEFORE_INSERT" 
before insert
on component_cgmp
for each row
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into component_cgmp_audit (
     unit_id, coll_date, chapter_id, product_code, aliquot,
    parm_code, parm_value, equip_reference, process_dats, insert_dats,
    insert_user, audit_key, program_id, audit_insert_dats,
    audit_insert_user)
    values
     (:new.unit_id, :new.coll_date, :new.chapter_id, :new.product_code,
      :new.aliquot, :new.parm_code, :new.parm_value,
      :new.equip_reference, :new.process_dats, :new.insert_dats,
      :new.insert_user, :new.audit_key, :new.program_id,
      sysdate, lt_user_session.get_userid
     );
end;
/
ALTER TRIGGER "COMPONENT_CGMP_BEFORE_INSERT" ENABLE;
