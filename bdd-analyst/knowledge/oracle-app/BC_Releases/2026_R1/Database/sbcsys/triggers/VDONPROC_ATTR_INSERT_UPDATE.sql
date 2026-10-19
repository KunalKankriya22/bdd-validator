--------------------------------------------------------
--  DDL for Trigger VDONPROC_ATTR_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VDONPROC_ATTR_INSERT_UPDATE" 
before insert  or update
on valid_don_proc_attribute
for each row
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_don_proc_attribute_audit
	(
		donation_type, procedure_code,
		sort_sequence, attrib_group, attrib_code,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.donation_type,:new.procedure_code,:new.sort_sequence,
		:new.attrib_group,:new.attrib_code,
		:new.eff_date,:new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VDONPROC_ATTR_INSERT_UPDATE" ENABLE;
