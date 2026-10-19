--------------------------------------------------------
--  DDL for Trigger QUARANTINE_PRODUCTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "QUARANTINE_PRODUCTS_BD" before delete on QUARANTINE_PRODUCTS
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
  (	:old.CHAPTER_ID,
	:old.UNIT_ID,
	:old.PRODUCT_CODE,
	:old.ALIQUOT,
	:old.INSERT_DATE,
	:old.INSERT_USER_ID,
	:old.QU_REASON,
	:old.COLL_DATE,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
end ;
/
ALTER TRIGGER "QUARANTINE_PRODUCTS_BD" ENABLE;
