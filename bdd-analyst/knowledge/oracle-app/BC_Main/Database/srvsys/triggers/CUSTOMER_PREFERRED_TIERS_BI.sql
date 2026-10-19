--------------------------------------------------------
--  DDL for Trigger CUSTOMER_PREFERRED_TIERS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CUSTOMER_PREFERRED_TIERS_BI" before insert
on CUSTOMER_PREFERRED_TIERS for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into CUSTOMER_PREFERRED_TIERS_AUDIT
  (	CHAPTER_ID,
	CUSTOMER_ID,
	PRODUCT_TYPE,
	TIER,
	ALTERNATE_TIER_FLAG,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CHAPTER_ID,
	:new.CUSTOMER_ID,
	:new.PRODUCT_TYPE,
	:new.TIER,
	:new.ALTERNATE_TIER_FLAG,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
end ;
/
ALTER TRIGGER "CUSTOMER_PREFERRED_TIERS_BI" ENABLE;
