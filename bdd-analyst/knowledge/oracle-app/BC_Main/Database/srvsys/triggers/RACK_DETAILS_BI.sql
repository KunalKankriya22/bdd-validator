--------------------------------------------------------
--  DDL for Trigger RACK_DETAILS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RACK_DETAILS_BI" before insert on RACK_DETAILS for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into RACK_DETAILS_AUDIT
  (	CHAPTER_ID,
	WAREHOUSE_ID,
	DEVICE_TYPE,
	DEVICE_NUMBER,
	RACK_NUMBER,
	PRODUCT_TYPE,
	RACK_DESCRIPTION,
	SHELF_COUNT,
	TRAY_COUNT,
	BLOOD_TYPE,
	STORAGE_CLASS,
	MIX_ABO,
	MIX_PRODUCT,
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
	:new.RACK_NUMBER,
	:new.PRODUCT_TYPE,
	:new.RACK_DESCRIPTION,
	:new.SHELF_COUNT,
	:new.TRAY_COUNT,
	:new.BLOOD_TYPE,
	:new.STORAGE_CLASS,
	:new.MIX_ABO,
	:new.MIX_PRODUCT,
	:new.EFFECTIVE_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "RACK_DETAILS_BI" ENABLE;
