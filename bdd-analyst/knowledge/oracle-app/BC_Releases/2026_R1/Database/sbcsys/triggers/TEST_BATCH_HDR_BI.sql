--------------------------------------------------------
--  DDL for Trigger TEST_BATCH_HDR_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_BATCH_HDR_BI" 
before insert
on TEST_BATCH_HDR
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;

           --

   insert into TEST_BATCH_HDR_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, GROUP_TEST_ID,
	FIRST_UNIT_ID, LAST_UNIT_ID, REPEAT_FLAG,
	START_WORK_NUMBER, INSERT_DATS, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.TB_ID, :new.TEST_CHAPTER_ID, :new.GROUP_TEST_ID,
	:new.FIRST_UNIT_ID, :new.LAST_UNIT_ID, :new.REPEAT_FLAG,
	:new.START_WORK_NUMBER, :new.INSERT_DATS, :new.USER_ID,
	:new.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
/
ALTER TRIGGER "TEST_BATCH_HDR_BI" ENABLE;
