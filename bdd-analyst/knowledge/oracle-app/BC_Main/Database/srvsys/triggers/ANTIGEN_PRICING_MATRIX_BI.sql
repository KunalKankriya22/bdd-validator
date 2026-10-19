--------------------------------------------------------
--  DDL for Trigger ANTIGEN_PRICING_MATRIX_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "ANTIGEN_PRICING_MATRIX_BI" before insert on ANTIGEN_PRICING_MATRIX
for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into ANTIGEN_PRICING_MATRIX_AUDIT
    (
	ANTIGEN_QTY,
	STD_PRICE,
	EFF_DATE,
	LAST_MODIFIED_DATE,
	TERM_DATE,
	SERVICE_CODE,
	ANTIGEN_DESC,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
	)
    values
	(
	:new.ANTIGEN_QTY,
	:new.STD_PRICE,
	:new.EFF_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
	:new.SERVICE_CODE,
	:new.ANTIGEN_DESC,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
	)
  ;
end ;
/
ALTER TRIGGER "ANTIGEN_PRICING_MATRIX_BI" ENABLE;
