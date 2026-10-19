--------------------------------------------------------
--  DDL for Trigger VALID_PROCPROD_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PROCPROD_INSERT_UPDATE" 
before insert  or update
on valid_procprod_matrix
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
    :new.last_modify_date := sysdate;
	--
    insert into valid_procprod_matrix_audit
	( proc, product_type, eff_date, last_modify_date,
	  term_date, audit_key, program_id, audit_insert_Dats,
	  audit_insert_user)
	values
	( :new.proc, :new.product_type, :new.eff_date, :new.last_modify_date,
	  :new.term_date, :new.audit_key, :new.program_id, sysdate,
	  lt_user_session.get_userid);
end;
/
ALTER TRIGGER "VALID_PROCPROD_INSERT_UPDATE" ENABLE;
