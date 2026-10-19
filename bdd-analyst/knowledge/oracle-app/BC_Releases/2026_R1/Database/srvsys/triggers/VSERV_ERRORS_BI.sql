--------------------------------------------------------
--  DDL for Trigger VSERV_ERRORS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ERRORS_BI" before insert on VSERV_ERRORS for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into VSERV_ERRORS_AUDIT
  (	ERROR_CODE,
	ERROR_TYPE,
	ERROR,
	APPL_NAME,
	AUDIT_FLAG,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.ERROR_CODE,
	:new.ERROR_TYPE,
	:new.ERROR,
	:new.APPL_NAME,
	:new.AUDIT_FLAG,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ERRORS_BI" ENABLE;
