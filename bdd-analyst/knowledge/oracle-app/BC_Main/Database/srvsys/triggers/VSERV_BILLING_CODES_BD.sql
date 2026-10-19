--------------------------------------------------------
--  DDL for Trigger VSERV_BILLING_CODES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_BILLING_CODES_BD" 
before delete on VSERV_BILLING_CODES
for each row
begin
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
  (	:old.BILLING_CODE,
	:old.CODE_DESC,
	:old.EFF_DATE,
	:old.TERM_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.AUDIT_KEY,
    nvl(:old.program_id,'MANUAL'),LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_BILLING_CODES_BD" ENABLE;
