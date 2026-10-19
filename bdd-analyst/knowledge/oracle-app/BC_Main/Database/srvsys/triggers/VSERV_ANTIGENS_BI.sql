--------------------------------------------------------
--  DDL for Trigger VSERV_ANTIGENS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ANTIGENS_BI" before insert on VSERV_ANTIGENS for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
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
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_ANTIGENS_BI" ENABLE;
