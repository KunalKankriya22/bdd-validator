--------------------------------------------------------
--  DDL for Trigger RGT_UNITS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_UNITS_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,CONTRACT_ID
  ,BATCH_ID
  ,UNIT_ID
  ,PROFILE_TESTS
  ,STAT_TESTS
  ,UPLOAD_STATUS
  ,COLL_DATE
  ,COLLECTION_DATE
  ON SBCSYS.RGT_UNITS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_UNITS_aud	      RGT_UNITS_AUDIT%rowtype;
begin
    RGT_UNITS_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_UNITS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_UNITS_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_UNITS_aud.BATCH_ID:= nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_UNITS_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.PROFILE_TESTS,'*') !=
       nvl(:new.PROFILE_TESTS,'*')
    then
       RGT_UNITS_aud.PROFILE_TESTS:= nvl(:new.PROFILE_TESTS,'*');
    end if;
    if nvl(:old.STAT_TESTS,'*') !=
       nvl(:new.STAT_TESTS,'*')
    then
       RGT_UNITS_aud.STAT_TESTS:= nvl(:new.STAT_TESTS,'*');
    end if;
    if nvl(:old.UPLOAD_STATUS,'*') !=
       nvl(:new.UPLOAD_STATUS,'*')
    then
       RGT_UNITS_aud.UPLOAD_STATUS:= nvl(:new.UPLOAD_STATUS,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_UNITS_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.COLLECTION_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLLECTION_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_UNITS_aud.COLLECTION_DATE := nvl(:new.COLLECTION_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;


    --
    insert into RGT_UNITS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, BATCH_ID,
	UNIT_ID, PROFILE_TESTS, STAT_TESTS,
	UPLOAD_STATUS, COLL_DATE, COLLECTION_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_UNITS_aud.CHAPTER_ID, RGT_UNITS_aud.CONTRACT_ID, RGT_UNITS_aud.BATCH_ID,
	RGT_UNITS_aud.UNIT_ID, RGT_UNITS_aud.PROFILE_TESTS, RGT_UNITS_aud.STAT_TESTS,
	RGT_UNITS_aud.UPLOAD_STATUS, RGT_UNITS_aud.COLL_DATE, RGT_UNITS_aud.COLLECTION_DATE,
	RGT_UNITS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_UNITS_BU" ENABLE;
