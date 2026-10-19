--------------------------------------------------------
--  DDL for Trigger VSERV_CONTRACTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CONTRACTS_BI" before insert on VSERV_CONTRACTS for each row
declare
  temp_audit_key	number(23);
  nCount      	  	number := 0;
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
   -- Check if the table is institution level
   select nvl(count(*),0)
     into nCount
     from institution_tables
    where table_name = 'VSERV_CONTRACTS' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
   If nCount > 0 then
     :new.chapter_id := 'ALL';
   End If;
   --
  insert into VSERV_CONTRACTS_AUDIT
  (	CONTRACT_ID,
	CHAPTER_ID,
	CUSTOMER_ID,
	CREDIT_LIMIT,
	AGREED_AMOUNT,
	DISCOUNT,
	USED_CREDIT,
	HOSPITAL_LEVEL,
	START_TERM,
	END_TERM,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	MAX_DISCOUNT_PCT,
	ROTATION_FLAG,
	PO_NUMBER,
	SUBSTITUTE_FLAG,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CONTRACT_ID,
	:new.CHAPTER_ID,
	:new.CUSTOMER_ID,
	:new.CREDIT_LIMIT,
	:new.AGREED_AMOUNT,
	:new.DISCOUNT,
	:new.USED_CREDIT,
	:new.HOSPITAL_LEVEL,
	:new.START_TERM,
	:new.END_TERM,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.MAX_DISCOUNT_PCT,
	:new.ROTATION_FLAG,
	:new.PO_NUMBER,
	:new.SUBSTITUTE_FLAG,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
/
ALTER TRIGGER "VSERV_CONTRACTS_BI" ENABLE;
