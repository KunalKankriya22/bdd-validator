--------------------------------------------------------
--  DDL for Trigger RGT_SKIP_SAMPLES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_SKIP_SAMPLES_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,CONTRACT_ID
  ,UNIT_ID
  ,COLL_DATE
  ,SKIP_FLAG
  ,INSERT_DATE
  ,INSERT_USER_ID
  ,REASON_CODE
  ,RESET_DATE
  ON SBCSYS.RGT_SKIP_SAMPLES
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_SKIP_SAMPLES_aud	      RGT_SKIP_SAMPLES_AUDIT%rowtype;
begin
    RGT_SKIP_SAMPLES_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_SKIP_SAMPLES_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_SKIP_SAMPLES_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_SKIP_SAMPLES_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_SKIP_SAMPLES_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.SKIP_FLAG,'*') !=
       nvl(:new.SKIP_FLAG,'*')
    then
       RGT_SKIP_SAMPLES_aud.SKIP_FLAG:= nvl(:new.SKIP_FLAG,'*');
    end if;
    if nvl(:old.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_SKIP_SAMPLES_aud.INSERT_DATE := nvl(:new.INSERT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_USER_ID,'*') !=
       nvl(:new.INSERT_USER_ID,'*')
    then
       RGT_SKIP_SAMPLES_aud.INSERT_USER_ID:= nvl(:new.INSERT_USER_ID,'*');
    end if;
    if nvl(:old.REASON_CODE,'*') !=
       nvl(:new.REASON_CODE,'*')
    then
       RGT_SKIP_SAMPLES_aud.REASON_CODE:= nvl(:new.REASON_CODE,'*');
    end if;
    if nvl(:old.RESET_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RESET_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_SKIP_SAMPLES_aud.RESET_DATE := nvl(:new.RESET_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;

    --
    insert into RGT_SKIP_SAMPLES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, UNIT_ID,
	COLL_DATE, SKIP_FLAG, INSERT_DATE,
	INSERT_USER_ID, REASON_CODE, RESET_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_SKIP_SAMPLES_aud.CHAPTER_ID, RGT_SKIP_SAMPLES_aud.CONTRACT_ID, RGT_SKIP_SAMPLES_aud.UNIT_ID,
	RGT_SKIP_SAMPLES_aud.COLL_DATE, RGT_SKIP_SAMPLES_aud.SKIP_FLAG, RGT_SKIP_SAMPLES_aud.INSERT_DATE,
	RGT_SKIP_SAMPLES_aud.INSERT_USER_ID, RGT_SKIP_SAMPLES_aud.REASON_CODE, RGT_SKIP_SAMPLES_aud.RESET_DATE,
	RGT_SKIP_SAMPLES_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_SKIP_SAMPLES_BU" ENABLE;
