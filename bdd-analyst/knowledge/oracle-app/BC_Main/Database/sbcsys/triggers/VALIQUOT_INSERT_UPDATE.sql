--------------------------------------------------------
--  DDL for Trigger VALIQUOT_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALIQUOT_INSERT_UPDATE" 
before insert  or update
on valid_aliquots
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
    insert into valid_aliquots_audit
	(
		old_product_code, new_product_code,
		aliquot, seq_no,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.old_product_code,:new.new_product_code,
		:new.aliquot,:new.seq_no,
		:new.eff_date,:new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALIQUOT_INSERT_UPDATE" ENABLE;
