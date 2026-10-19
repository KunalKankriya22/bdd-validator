--------------------------------------------------------
--  DDL for Trigger VSERV_ERRORS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ERRORS_BU" before update on VSERV_ERRORS for each row
begin
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
	'UPDATE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ERRORS_BU" ENABLE;
