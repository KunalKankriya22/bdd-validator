--------------------------------------------------------
--  DDL for Trigger VALID_AUTO_INTER_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_AUTO_INTER_CONFIG_BI" 
before insert
on VALID_AUTO_INTER_CONFIG
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
        --
    insert into VALID_AUTO_INTER_CONFIG_audit
    (
        CHAPTER_ID, ACTION_FUNCTION_NAME, ACTION_TYPE,
        ACTION_CODE, ACTION_PRODUCT_CODE, INTER_ON_CURRENT_PROD,
        INTER_ON_OTHER_PRODS, INTER_ON_OTHER_PROD_TYPES, INTER_ON_UNIT_LEVEL,
        INTER_ALL_PROD_BUT_CURR, INTER_CODE,AUDIT_KEY,
	PROGRAM_ID,INSERT_DATE, INSERT_USER, EFF_DATE, TERM_DATE,
	AUDIT_USER,AUDIT_DATE
    )
    values
    (
        :new.CHAPTER_ID, :new.ACTION_FUNCTION_NAME, :new.ACTION_TYPE,
        :new.ACTION_CODE, :new.ACTION_PRODUCT_CODE, :new.INTER_ON_CURRENT_PROD,
	:new.INTER_ON_OTHER_PRODS, :new.INTER_ON_OTHER_PROD_TYPES, :new.INTER_ON_UNIT_LEVEL,
        :new.INTER_ALL_PROD_BUT_CURR,:new.INTER_CODE, :new.AUDIT_KEY,
	:new.PROGRAM_ID,:new.INSERT_DATE, :new.INSERT_USER, :new.EFF_DATE, :new.TERM_DATE,
	lt_user_session.get_userid, sysdate
    );
    end;
/
ALTER TRIGGER "VALID_AUTO_INTER_CONFIG_BI" ENABLE;
