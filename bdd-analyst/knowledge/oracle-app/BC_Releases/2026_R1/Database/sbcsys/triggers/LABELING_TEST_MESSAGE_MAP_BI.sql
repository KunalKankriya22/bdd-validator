--------------------------------------------------------
--  DDL for Trigger LABELING_TEST_MESSAGE_MAP_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LABELING_TEST_MESSAGE_MAP_BI" 
before insert
on LABELING_TEST_MESSAGE_MAP
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
        --
    insert into LABELING_TEST_MESSAGE_MAP_ADT
    (
        LT_TEST_ID, RESULT_CODE, DISPLY_TEST_ID,
        MESSAGE_DESC, EFF_DATE, INSERT_DATE,
	INSERT_USER,PROGRAM_ID, AUDIT_KEY,TERM_DATE,
	AUDIT_USER,AUDIT_DATE
    )
    values
    (
        :new.LT_TEST_ID, :new.RESULT_CODE, :new.DISPLY_TEST_ID,
        :new.MESSAGE_DESC, :new.EFF_DATE, :new.INSERT_DATE,
	:new.INSERT_USER, :new.PROGRAM_ID, :new.AUDIT_KEY, :new.TERM_DATE,
	lt_user_session.get_userid, sysdate
    );
    end;
/
ALTER TRIGGER "LABELING_TEST_MESSAGE_MAP_BI" ENABLE;
