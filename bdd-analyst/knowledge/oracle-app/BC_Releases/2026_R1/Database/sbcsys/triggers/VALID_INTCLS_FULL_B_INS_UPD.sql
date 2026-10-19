--------------------------------------------------------
--  DDL for Trigger VALID_INTCLS_FULL_B_INS_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTCLS_FULL_B_INS_UPD" 
before insert  or update
on valid_interdiction_class
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
    insert into valid_interdiction_class_audit
	(
		inter_code, inter_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.inter_code, :new.inter_class,
		:new.eff_date, :new.term_date, :new.last_modified_date,
		:new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_INTCLS_FULL_B_INS_UPD" ENABLE;
