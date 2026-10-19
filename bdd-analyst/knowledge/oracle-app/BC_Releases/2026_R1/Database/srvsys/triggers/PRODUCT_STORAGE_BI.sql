--------------------------------------------------------
--  DDL for Trigger PRODUCT_STORAGE_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PRODUCT_STORAGE_BI" before insert on PRODUCT_STORAGE for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into PRODUCT_STORAGE_AUDIT
  (	CHAPTER_ID,
	WAREHOUSE_ID,
	DEVICE_TYPE,
	DEVICE_NUMBER,
	PRODUCT_TYPE,
	TRAY_CAPACITY,
	EFFECTIVE_DATE,
	LAST_MODIFIED_DATE,
	TERM_DATE,
    AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CHAPTER_ID,
	:new.WAREHOUSE_ID,
	:new.DEVICE_TYPE,
	:new.DEVICE_NUMBER,
	:new.PRODUCT_TYPE,
	:new.TRAY_CAPACITY,
	:new.EFFECTIVE_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
    :new.AUDIT_KEY,
	'INSERT',
	LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "PRODUCT_STORAGE_BI" ENABLE;
