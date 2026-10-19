--------------------------------------------------------
--  DDL for Trigger FR_PROD_PROC_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_PROD_PROC_INSERT_UPDATE" 
before insert  or update
on "FR_VPRODUCT_PROCESSES"
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
    insert into fr_vproduct_processes_audit
	(
		process_code, product_code,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.process_code,:new.product_code,
		:new.eff_date,:new.term_date,:new.last_modified_date,
		:new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "FR_PROD_PROC_INSERT_UPDATE" ENABLE;
