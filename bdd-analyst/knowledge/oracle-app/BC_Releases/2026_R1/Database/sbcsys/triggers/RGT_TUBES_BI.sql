--------------------------------------------------------
--  DDL for Trigger RGT_TUBES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TUBES_BI" 
before insert
on RGT_TUBES
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
           --
    insert into RGT_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, RED1_FLAG,
	RED2_FLAG, PURPLE1_FLAG, PURPLE2_FLAG,
	PROGRAM_ID, BATCH_ID, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.CBC_UNIT_ID,
	:new.UNIT_ID, :new.TUBE_CHECK_IN_DATE, :new.RED1_FLAG,
	:new.RED2_FLAG, :new.PURPLE1_FLAG, :new.PURPLE2_FLAG,
	:new.PROGRAM_ID, :new.BATCH_ID, :new.USER_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_TUBES_BI" ENABLE;
