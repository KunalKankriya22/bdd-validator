--------------------------------------------------------
--  DDL for Trigger SET_INVENTORY_LEVELS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "SET_INVENTORY_LEVELS_BI" before insert on
SET_INVENTORY_LEVELS
for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into SET_INVENTORY_LEVELS_AUDIT
  (	INVENTORY_CLASS,
	INVENTORY_TYPE,
	CHAPTER_ID,
	PRODUCT_TYPE,
	BLOOD_TYPE,
	QTY,
	EFF_DATE,
	LAST_MODIFIED_DATE,
	CUSTOMER_ID,
	TIER,
	TERM_DATE,
	ATTRIB_CODE,
	ATTRIB_GROUP,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.INVENTORY_CLASS,
	:new.INVENTORY_TYPE,
	:new.CHAPTER_ID,
	:new.PRODUCT_TYPE,
	:new.BLOOD_TYPE,
	:new.QTY,
	:new.EFF_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.CUSTOMER_ID,
	:new.TIER,
	:new.TERM_DATE,
	:new.ATTRIB_CODE,
	:new.ATTRIB_GROUP,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "SET_INVENTORY_LEVELS_BI" ENABLE;
