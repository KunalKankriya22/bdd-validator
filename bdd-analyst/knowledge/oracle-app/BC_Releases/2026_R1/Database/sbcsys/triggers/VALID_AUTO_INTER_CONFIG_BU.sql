--------------------------------------------------------
--  DDL for Trigger VALID_AUTO_INTER_CONFIG_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_AUTO_INTER_CONFIG_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,ACTION_FUNCTION_NAME
  ,ACTION_TYPE
  ,ACTION_CODE
  ,ACTION_PRODUCT_CODE
  ,INTER_ON_CURRENT_PROD
  ,INTER_ON_OTHER_PRODS
  ,INTER_ON_OTHER_PROD_TYPES
  ,INTER_ON_UNIT_LEVEL
  ,INTER_ALL_PROD_BUT_CURR
  ,INTER_CODE
  ,PROGRAM_ID
  ,INSERT_DATE
  ,INSERT_USER
  ,EFF_DATE
  ,TERM_DATE
ON SBCSYS.VALID_AUTO_INTER_CONFIG
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    VALID_AUTO_INTER_CONFIG_aud	      VALID_AUTO_INTER_CONFIG_AUDIT%rowtype;
begin
    VALID_AUTO_INTER_CONFIG_aud.audit_key := :old.audit_key;
    VALID_AUTO_INTER_CONFIG_aud.program_id := :new.program_id;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.ACTION_FUNCTION_NAME,'*') !=
       nvl(:new.ACTION_FUNCTION_NAME,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.ACTION_FUNCTION_NAME:= nvl(:new.ACTION_FUNCTION_NAME,'*');
    end if;
    if nvl(:old.ACTION_TYPE,'*') !=
       nvl(:new.ACTION_TYPE,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.ACTION_TYPE:= nvl(:new.ACTION_TYPE,'*');
    end if;
    if nvl(:old.ACTION_CODE,'*') !=
       nvl(:new.ACTION_CODE,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.ACTION_CODE:= nvl(:new.ACTION_CODE,'*');
    end if;
    if nvl(:old.ACTION_PRODUCT_CODE,'*') !=
       nvl(:new.ACTION_PRODUCT_CODE,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.ACTION_PRODUCT_CODE:= nvl(:new.ACTION_PRODUCT_CODE,'*');
    end if;
    if nvl(:old.INTER_ON_CURRENT_PROD,'*') !=
       nvl(:new.INTER_ON_CURRENT_PROD,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_ON_CURRENT_PROD:= nvl(:new.INTER_ON_CURRENT_PROD,'*');
    end if;
    if nvl(:old.INTER_ON_OTHER_PRODS,'*') !=
       nvl(:new.INTER_ON_OTHER_PRODS,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_ON_OTHER_PRODS:= nvl(:new.INTER_ON_OTHER_PRODS,'*');
    end if;
    if nvl(:old.INTER_ON_OTHER_PROD_TYPES,'*') !=
       nvl(:new.INTER_ON_OTHER_PROD_TYPES,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_ON_OTHER_PROD_TYPES:= nvl(:new.INTER_ON_OTHER_PROD_TYPES,'*');
    end if;
    if nvl(:old.INTER_ON_UNIT_LEVEL,'*') !=
       nvl(:new.INTER_ON_UNIT_LEVEL,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_ON_UNIT_LEVEL:= nvl(:new.INTER_ON_UNIT_LEVEL,'*');
    end if;
    if nvl(:old.INTER_ALL_PROD_BUT_CURR,'*') !=
       nvl(:new.INTER_ALL_PROD_BUT_CURR,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_ALL_PROD_BUT_CURR:= nvl(:new.INTER_ALL_PROD_BUT_CURR,'*');
    end if;
    if nvl(:old.INTER_CODE,'*') !=
       nvl(:new.INTER_CODE,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INTER_CODE:= nvl(:new.INTER_CODE,'*');
    end if;
    if nvl(:old.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       VALID_AUTO_INTER_CONFIG_aud.INSERT_DATE := nvl(:new.INSERT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_USER,'*') !=
       nvl(:new.INSERT_USER,'*')
    then
       VALID_AUTO_INTER_CONFIG_aud.INSERT_USER:= nvl(:new.INSERT_USER,'*');
    end if;
    if nvl(:old.EFF_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.EFF_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       VALID_AUTO_INTER_CONFIG_aud.EFF_DATE := nvl(:new.EFF_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.TERM_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TERM_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       VALID_AUTO_INTER_CONFIG_aud.TERM_DATE := nvl(:new.TERM_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;

    --
    insert into VALID_AUTO_INTER_CONFIG_AUDIT
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
        VALID_AUTO_INTER_CONFIG_aud.CHAPTER_ID, VALID_AUTO_INTER_CONFIG_aud.ACTION_FUNCTION_NAME, VALID_AUTO_INTER_CONFIG_aud.ACTION_TYPE,
        VALID_AUTO_INTER_CONFIG_aud.ACTION_CODE, VALID_AUTO_INTER_CONFIG_aud.ACTION_PRODUCT_CODE, VALID_AUTO_INTER_CONFIG_aud.INTER_ON_CURRENT_PROD,
	VALID_AUTO_INTER_CONFIG_aud.INTER_ON_OTHER_PRODS, VALID_AUTO_INTER_CONFIG_aud.INTER_ON_OTHER_PROD_TYPES, VALID_AUTO_INTER_CONFIG_aud.INTER_ON_UNIT_LEVEL,
        VALID_AUTO_INTER_CONFIG_aud.INTER_ALL_PROD_BUT_CURR,VALID_AUTO_INTER_CONFIG_aud.INTER_CODE, VALID_AUTO_INTER_CONFIG_aud.AUDIT_KEY,
	VALID_AUTO_INTER_CONFIG_aud.PROGRAM_ID,VALID_AUTO_INTER_CONFIG_aud.INSERT_DATE, VALID_AUTO_INTER_CONFIG_aud.INSERT_USER, VALID_AUTO_INTER_CONFIG_aud.EFF_DATE, VALID_AUTO_INTER_CONFIG_aud.TERM_DATE,
	lt_user_session.get_userid, sysdate
    );
end;
/
ALTER TRIGGER "VALID_AUTO_INTER_CONFIG_BU" ENABLE;
