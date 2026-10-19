--------------------------------------------------------
--  DDL for Trigger RGT_SCHEDULE_EXTRACT_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_SCHEDULE_EXTRACT_BI" 
before insert
on RGT_SCHEDULE_EXTRACT
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
           --
     insert into RGT_SCHEDULE_EXTRACT_AUDIT
    (
	FILE_NAME, EXTRACT_DATE_TIME, STATUS,
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.FILE_NAME, :new.EXTRACT_DATE_TIME, :new.STATUS,
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.RESULT_PARM_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_SCHEDULE_EXTRACT_BI" ENABLE;
