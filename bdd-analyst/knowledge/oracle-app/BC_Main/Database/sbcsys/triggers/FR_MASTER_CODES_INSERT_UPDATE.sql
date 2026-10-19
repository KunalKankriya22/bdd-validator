--------------------------------------------------------
--  DDL for Trigger FR_MASTER_CODES_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_MASTER_CODES_INSERT_UPDATE" 
before insert  or update
on fr_master_codes
for each row
declare
      temp_audit_key	number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
    insert into fr_master_codes_audit
	(
		code_type, code, code_desc,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.code_type,:new.code,:new.code_desc,
		:new.eff_date,:new.term_date,:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "FR_MASTER_CODES_INSERT_UPDATE" ENABLE;
