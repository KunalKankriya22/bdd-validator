--------------------------------------------------------
--  DDL for Trigger PRODUCT_PRICING_MATRIX_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PRODUCT_PRICING_MATRIX_BI" before insert on
PRODUCT_PRICING_MATRIX for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into PRODUCT_PRICING_MATRIX_AUDIT
  ( CHAPTER_ID,
	PRODUCT_TYPE,
	TIER,
	FROM_DAY,
	TO_DAY,
	UNIT_PRICE,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	CUSTOMER_ID,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  ( :new.CHAPTER_ID,
	:new.PRODUCT_TYPE,
	:new.TIER,
	:new.FROM_DAY,
	:new.TO_DAY,
	:new.UNIT_PRICE,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.CUSTOMER_ID,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "PRODUCT_PRICING_MATRIX_BI" ENABLE;
