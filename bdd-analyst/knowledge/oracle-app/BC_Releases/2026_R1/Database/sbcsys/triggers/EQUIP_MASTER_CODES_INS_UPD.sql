--------------------------------------------------------
--  DDL for Trigger EQUIP_MASTER_CODES_INS_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "EQUIP_MASTER_CODES_INS_UPD" 
before insert  or update
on equip_master_codes
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
    insert into equip_master_codes_audit
	  (CODE_TYPE, CODE, CODE_DESC, EFF_DATE , TERM_DATE,
	  LAST_MODIFIED_DATE, MODIFIED_BY, PROGRAM_ID, AUDIT_KEY,
	  AUDIT_INSERT_USER , AUDIT_INSERT_DATE )
	values
	(
		:new.code_type,:new.code,:new.code_desc,
		:new.eff_date,:new.term_date,:new.last_modified_date,
		:new.modified_by,
		:new.program_id,:new.audit_key, lt_user_session.get_userid, sysdate
	);
end;
/
ALTER TRIGGER "EQUIP_MASTER_CODES_INS_UPD" ENABLE;
