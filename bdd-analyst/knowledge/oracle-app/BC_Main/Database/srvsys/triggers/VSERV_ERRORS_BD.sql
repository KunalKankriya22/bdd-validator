--------------------------------------------------------
--  DDL for Trigger VSERV_ERRORS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ERRORS_BD" before delete on VSERV_ERRORS for each row
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
  (	:old.ERROR_CODE,
	:old.ERROR_TYPE,
	:old.ERROR,
	:old.APPL_NAME,
	:old.AUDIT_FLAG,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ERRORS_BD" ENABLE;
