--------------------------------------------------------
--  DDL for Trigger EQUIP_MASTER_CODES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "EQUIP_MASTER_CODES_BD" 
before delete
on equip_master_codes
for each row
begin
    insert into equip_master_codes_audit
	  (CODE_TYPE, CODE, CODE_DESC, EFF_DATE , TERM_DATE,
	  LAST_MODIFIED_DATE, MODIFIED_BY, PROGRAM_ID, AUDIT_KEY,
	  AUDIT_INSERT_USER , AUDIT_INSERT_DATE )
	values
	(
	 :old.code_type,:old.code,:old.code_desc,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.modified_by,
		 'DELETE',:old.audit_key, lt_user_session.get_userid,sysdate
	 );
end;
/
ALTER TRIGGER "EQUIP_MASTER_CODES_BD" ENABLE;
