--------------------------------------------------------
--  DDL for Trigger CUSTOMERS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CUSTOMERS_BI" before insert on CUSTOMERS for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into CUSTOMERS_AUDIT
  (	CUSTOMER_ID,
	CHAPTER_ID,
	ALPHA_KEY,
	CUSTOMER_TYPE,
	NAME,
	SHORT_NAME,
	ADDRESS_1,
	ADDRESS_2,
	ADDRESS_3,
	CITY,
	STATE,
	COUNTRY,
	ZIP,
	PHONE_NO,
	FAX_NO,
	TELEX_NO,
	PAYEE_ID,
	COD_FLAG,
	RETURN_ACCEPTED_FLAG,
	EFF_DATE,
	LAST_MODIFIED_DATE,
	PHONE_EXT,
	AR_ACCOUNT,
	CP6_DEST,
	FI_PRICE_SCH_NO,
	PRICE_CHANGE_FLAG,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
	values
  (	:new.CUSTOMER_ID,
	:new.CHAPTER_ID,
	:new.ALPHA_KEY,
	:new.CUSTOMER_TYPE,
	:new.NAME,
	:new.SHORT_NAME,
	:new.ADDRESS_1,
	:new.ADDRESS_2,
	:new.ADDRESS_3,
	:new.CITY,
	:new.STATE,
	:new.COUNTRY,
	:new.ZIP,
	:new.PHONE_NO,
	:new.FAX_NO,
	:new.TELEX_NO,
	:new.PAYEE_ID,
	:new.COD_FLAG,
	:new.RETURN_ACCEPTED_FLAG,
	:new.EFF_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.PHONE_EXT,
	:new.AR_ACCOUNT,
	:new.CP6_DEST,
	:new.FI_PRICE_SCH_NO,
	:new.price_change_flag,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
end ;
/
ALTER TRIGGER "CUSTOMERS_BI" ENABLE;
