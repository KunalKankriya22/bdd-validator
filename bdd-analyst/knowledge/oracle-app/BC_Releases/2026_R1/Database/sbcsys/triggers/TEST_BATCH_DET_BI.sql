--------------------------------------------------------
--  DDL for Trigger TEST_BATCH_DET_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_BATCH_DET_BI" 
before insert
on TEST_BATCH_DET
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;

           --

    insert into TEST_BATCH_DET_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, TEST_ID,
	TEST_KIT_ID, TEST_TYPE, CUT_OFF_VALUE,
	REF_RESULT, REF_RATIO, REF_CONTROL,
	REF_ABSORBANCE, STATION_NO, RECONCILE_FLAG,
	RECONCILE_DATE, RECONCILE_USER_ID, TESTING_LAB_CODE,
	REVIEW_DATE, PARM_TYPE, PARM_CHECK_FLAG,
	PARM_CHECK_DATE, PARM_CHECK_USER_ID, RUN_ID,
	REVIEW_USER_ID, KIT_LOT_NUMBER,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.TB_ID, :new.TEST_CHAPTER_ID, :new.TEST_ID,
	:new.TEST_KIT_ID, :new.TEST_TYPE, :new.CUT_OFF_VALUE,
	:new.REF_RESULT, :new.REF_RATIO, :new.REF_CONTROL,
	:new.REF_ABSORBANCE, :new.STATION_NO, :new.RECONCILE_FLAG,
	:new.RECONCILE_DATE, :new.RECONCILE_USER_ID, :new.TESTING_LAB_CODE,
	:new.REVIEW_DATE, :new.PARM_TYPE, :new.PARM_CHECK_FLAG,
	:new.PARM_CHECK_DATE, :new.PARM_CHECK_USER_ID, :new.RUN_ID,
	:new.REVIEW_USER_ID, :new.KIT_LOT_NUMBER,
	:new.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
/
ALTER TRIGGER "TEST_BATCH_DET_BI" ENABLE;
