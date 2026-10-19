--------------------------------------------------------
--  DDL for Trigger PRODUCT_PRICING_MATRIX_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PRODUCT_PRICING_MATRIX_BD" before delete
on PRODUCT_PRICING_MATRIX for each row
begin
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
  ( :old.CHAPTER_ID,
	:old.PRODUCT_TYPE,
	:old.TIER,
	:old.FROM_DAY,
	:old.TO_DAY,
	:old.UNIT_PRICE,
	:old.EFF_DATE,
	:old.TERM_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.CUSTOMER_ID,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "PRODUCT_PRICING_MATRIX_BD" ENABLE;
