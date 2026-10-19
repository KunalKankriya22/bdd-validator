--------------------------------------------------------
--  DDL for Trigger QUARANTINE_PRODUCTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "QUARANTINE_PRODUCTS_BU" before update on QUARANTINE_PRODUCTS
for each row
begin
  insert into QUARANTINE_PRODUCTS_AUDIT
  (	CHAPTER_ID,
	UNIT_ID,
	PRODUCT_CODE,
	ALIQUOT,
	INSERT_DATE,
	INSERT_USER_ID,
	QU_REASON,
	COLL_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CHAPTER_ID,
	:new.UNIT_ID,
	:new.PRODUCT_CODE,
	:new.ALIQUOT,
	:new.INSERT_DATE,
	:new.INSERT_USER_ID,
	:new.QU_REASON,
	:new.COLL_DATE,
	:new.AUDIT_KEY,
	'UPDATE',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
end ;
/
ALTER TRIGGER "QUARANTINE_PRODUCTS_BU" ENABLE;
