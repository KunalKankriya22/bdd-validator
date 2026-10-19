--------------------------------------------------------
--  DDL for Trigger VALID_PRODEQUIP_CGMP_IU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PRODEQUIP_CGMP_IU" 
before insert  or update
on VALID_PRODEQUIP_CGMP
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
    insert into VALID_PRODEQUIP_CGMP_AUDIT
	(EQUIP_TYPE,PROC,PRODUCT_CODE,PARM_CODE,
         ACCEPT_MIN,ACCEPT_MAX,EFF_DATE,LAST_MODIFY_DATE,TERM_DATE,
         AUDIT_KEY,PROGRAM_ID,AUDIT_INSERT_USER,AUDIT_INSERT_DATE)
	values
	( :new.EQUIP_TYPE,:new.PROC,:new.PRODUCT_CODE,:new.PARM_CODE,
	  :new.ACCEPT_MIN,:new.ACCEPT_MAX,:new.EFF_DATE,:new.LAST_MODIFY_DATE,:new.TERM_DATE,
          :new.AUDIT_KEY,:new.program_id,lt_user_session.get_userid,sysdate);
end;
/
ALTER TRIGGER "VALID_PRODEQUIP_CGMP_IU" ENABLE;
