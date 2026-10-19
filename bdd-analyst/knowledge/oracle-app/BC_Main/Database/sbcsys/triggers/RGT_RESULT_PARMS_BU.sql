--------------------------------------------------------
--  DDL for Trigger RGT_RESULT_PARMS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_RESULT_PARMS_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,CONTRACT_ID
  ,RESULT_PARM_ID
  ,FROM_DATE
  ,TO_DATE
  ,INSERT_DATS
  ,INSERT_USER_ID
  ,BATCH_ID
  ,UNIT_LIST
  ,STAT_TESTS
  ,RESULT_TYPE
  ,OTHER_BATCHES
  ,UNIT_COUNT
  ,UNDER_EXTRACT_FLAG
  ,RE_EXTRACT_FLAG

  ON SBCSYS.RGT_RESULT_PARMS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_RESULT_PARMS_aud	      RGT_RESULT_PARMS_AUDIT%rowtype;
begin
    RGT_RESULT_PARMS_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_RESULT_PARMS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_RESULT_PARMS_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.RESULT_PARM_ID,'*') !=
       nvl(:new.RESULT_PARM_ID,'*')
    then
       RGT_RESULT_PARMS_aud.RESULT_PARM_ID:= nvl(:new.RESULT_PARM_ID,'*');
    end if;
    if nvl(:old.FROM_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.FROM_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_RESULT_PARMS_aud.FROM_DATE := nvl(:new.FROM_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.TO_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TO_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_RESULT_PARMS_aud.TO_DATE := nvl(:new.TO_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_RESULT_PARMS_aud.INSERT_DATS := nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_USER_ID,'*') !=
       nvl(:new.INSERT_USER_ID,'*')
    then
       RGT_RESULT_PARMS_aud.INSERT_USER_ID:= nvl(:new.INSERT_USER_ID,'*');
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_RESULT_PARMS_aud.BATCH_ID:= nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.UNIT_LIST,'*') !=
       nvl(:new.UNIT_LIST,'*')
    then
       RGT_RESULT_PARMS_aud.UNIT_LIST:= nvl(:new.UNIT_LIST,'*');
    end if;
    if nvl(:old.STAT_TESTS,'*') !=
       nvl(:new.STAT_TESTS,'*')
    then
       RGT_RESULT_PARMS_aud.STAT_TESTS:= nvl(:new.STAT_TESTS,'*');
    end if;
    if nvl(:old.RESULT_TYPE,'*') !=
       nvl(:new.RESULT_TYPE,'*')
    then
       RGT_RESULT_PARMS_aud.RESULT_TYPE:= nvl(:new.RESULT_TYPE,'*');
    end if;
    if nvl(:old.OTHER_BATCHES,'*') !=
       nvl(:new.OTHER_BATCHES,'*')
    then
       RGT_RESULT_PARMS_aud.OTHER_BATCHES:= nvl(:new.OTHER_BATCHES,'*');
    end if;
    if nvl(:old.UNIT_COUNT,-1) !=
       nvl(:new.UNIT_COUNT,-1)
    then
       RGT_RESULT_PARMS_aud.UNIT_COUNT := nvl(:new.UNIT_COUNT,-1);
    end if;
    if nvl(:old.UNDER_EXTRACT_FLAG,'*') !=
       nvl(:new.UNDER_EXTRACT_FLAG,'*')
    then
       RGT_RESULT_PARMS_aud.UNDER_EXTRACT_FLAG:= nvl(:new.UNDER_EXTRACT_FLAG,'*');
    end if;
    if nvl(:old.RE_EXTRACT_FLAG,'*') !=
       nvl(:new.RE_EXTRACT_FLAG,'*')
    then
       RGT_RESULT_PARMS_aud.RE_EXTRACT_FLAG:= nvl(:new.RE_EXTRACT_FLAG,'*');
    end if;

    --
    insert into RGT_RESULT_PARMS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	FROM_DATE, TO_DATE, INSERT_DATS,
	INSERT_USER_ID, BATCH_ID, UNIT_LIST,
	STAT_TESTS, RESULT_TYPE, OTHER_BATCHES,
	UNIT_COUNT, UNDER_EXTRACT_FLAG, RE_EXTRACT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_RESULT_PARMS_aud.CHAPTER_ID, RGT_RESULT_PARMS_aud.CONTRACT_ID, RGT_RESULT_PARMS_aud.RESULT_PARM_ID,
	RGT_RESULT_PARMS_aud.FROM_DATE, RGT_RESULT_PARMS_aud.TO_DATE, RGT_RESULT_PARMS_aud.INSERT_DATS,
	RGT_RESULT_PARMS_aud.INSERT_USER_ID, RGT_RESULT_PARMS_aud.BATCH_ID, RGT_RESULT_PARMS_aud.UNIT_LIST,
	RGT_RESULT_PARMS_aud.STAT_TESTS, RGT_RESULT_PARMS_aud.RESULT_TYPE, RGT_RESULT_PARMS_aud.OTHER_BATCHES,
	RGT_RESULT_PARMS_aud.UNIT_COUNT, RGT_RESULT_PARMS_aud.UNDER_EXTRACT_FLAG, RGT_RESULT_PARMS_aud.RE_EXTRACT_FLAG,
	RGT_RESULT_PARMS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_RESULT_PARMS_BU" ENABLE;
