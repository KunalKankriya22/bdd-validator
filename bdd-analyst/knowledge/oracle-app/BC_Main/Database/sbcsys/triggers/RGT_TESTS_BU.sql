--------------------------------------------------------
--  DDL for Trigger RGT_TESTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TESTS_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,CONTRACT_ID
  ,BATCH_ID
  ,UNIT_ID
  ,TEST_ID
  ,TEST_SCHEDULE_STAT
ON SBCSYS.RGT_TESTS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_TESTS_aud	      RGT_TESTS%rowtype;
begin
    RGT_TESTS_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_TESTS_aud.CHAPTER_ID := nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_TESTS_aud.CONTRACT_ID := nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_TESTS_aud.BATCH_ID := nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_TESTS_aud.UNIT_ID := nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       RGT_TESTS_aud.TEST_ID := nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TEST_SCHEDULE_STAT,'*') !=
       nvl(:new.TEST_SCHEDULE_STAT,'*')
    then
       RGT_TESTS_aud.TEST_SCHEDULE_STAT := nvl(:new.TEST_SCHEDULE_STAT,'*');
    end if;


    --
    insert into RGT_TESTS_audit
    (
	CHAPTER_ID, CONTRACT_ID,BATCH_ID,
	UNIT_ID, TEST_ID, TEST_SCHEDULE_STAT,
	AUDIT_KEY,audit_insert_dats, audit_insert_user
    )
    values
    (
	RGT_TESTS_aud.CHAPTER_ID, RGT_TESTS_aud.CONTRACT_ID, RGT_TESTS_aud.BATCH_ID,
	RGT_TESTS_aud.UNIT_ID, RGT_TESTS_aud.TEST_ID, RGT_TESTS_aud.TEST_SCHEDULE_STAT,
	RGT_TESTS_aud.AUDIT_KEY,sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_TESTS_BU" ENABLE;
