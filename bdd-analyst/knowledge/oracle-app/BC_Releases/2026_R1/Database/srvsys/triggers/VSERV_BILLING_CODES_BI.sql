--------------------------------------------------------
--  DDL for Trigger VSERV_BILLING_CODES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_BILLING_CODES_BI" 
before insert on VSERV_BILLING_CODES
for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  insert into VSERV_BILLING_CODES_AUDIT
  (	BILLING_CODE,
	CODE_DESC,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.BILLING_CODE,
	:new.CODE_DESC,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.audit_key,
	nvl(:new.program_id,'MANUAL'),LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_BILLING_CODES_BI" ENABLE;
