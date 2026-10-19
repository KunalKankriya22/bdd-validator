--------------------------------------------------------
--  DDL for Trigger UNIT_ATTRIBUTES_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_ATTRIBUTES_BEFORE_INSERT" 
before insert
on unit_attributes
for each row
declare
      temp_audit_key	number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --
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
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.attrib_group, :new.attrib_code, :new.source_test_id,
		:new.status_flag, :new.stop_label_flag,
		:new.insert_dats, :new.insert_user_id,
		:new.audit_key,:new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "UNIT_ATTRIBUTES_BEFORE_INSERT" ENABLE;
