--------------------------------------------------------
--  DDL for Trigger TEST_BATCH_HDR_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_BATCH_HDR_BD" 
BEFORE DELETE
ON SBCSYS.TEST_BATCH_HDR
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

    insert into TEST_BATCH_HDR_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, GROUP_TEST_ID,
	FIRST_UNIT_ID, LAST_UNIT_ID, REPEAT_FLAG,
	START_WORK_NUMBER, INSERT_DATS, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.TB_ID, :old.TEST_CHAPTER_ID, :old.GROUP_TEST_ID,
	:old.FIRST_UNIT_ID, :old.LAST_UNIT_ID, :old.REPEAT_FLAG,
	:old.START_WORK_NUMBER, :old.INSERT_DATS, :old.USER_ID,
	:old.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
/
ALTER TRIGGER "TEST_BATCH_HDR_BD" ENABLE;
