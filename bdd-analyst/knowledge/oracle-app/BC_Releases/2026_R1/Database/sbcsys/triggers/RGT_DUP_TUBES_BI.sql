--------------------------------------------------------
--  DDL for Trigger RGT_DUP_TUBES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_DUP_TUBES_BI" 
before insert
on RGT_DUP_TUBES
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
           --
    insert into RGT_DUP_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, TUBE_TYPE,
	REASON_CODE, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.CBC_UNIT_ID,
	:new.UNIT_ID, :new.TUBE_CHECK_IN_DATE, :new.TUBE_TYPE,
	:new.REASON_CODE, :new.AUDIT_KEY,	:new.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_DUP_TUBES_BI" ENABLE;
