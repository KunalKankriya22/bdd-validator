--------------------------------------------------------
--  DDL for Trigger VSERV_ANTIGENS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ANTIGENS_BU" before update on VSERV_ANTIGENS for each row
begin
  insert into VSERV_ANTIGENS_AUDIT
  (	ANTIGEN_ID,
	ANTIGEN_DESC,
	PRICE,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.ANTIGEN_ID,
	:new.ANTIGEN_DESC,
	:new.PRICE,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.AUDIT_KEY,
	'UPDATE',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ANTIGENS_BU" ENABLE;
