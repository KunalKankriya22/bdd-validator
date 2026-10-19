--------------------------------------------------------
--  DDL for Trigger ANTIGEN_PRICING_MATRIX_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "ANTIGEN_PRICING_MATRIX_BD" before delete on ANTIGEN_PRICING_MATRIX
for each row
begin
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
	:old.ANTIGEN_QTY,
	:old.STD_PRICE,
	:old.EFF_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.TERM_DATE,
	:old.SERVICE_CODE,
	:old.ANTIGEN_DESC,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
	sysdate
	)
  ;
end ;
/
ALTER TRIGGER "ANTIGEN_PRICING_MATRIX_BD" ENABLE;
