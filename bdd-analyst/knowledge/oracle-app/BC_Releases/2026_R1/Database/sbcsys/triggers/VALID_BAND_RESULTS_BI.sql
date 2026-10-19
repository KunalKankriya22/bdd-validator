--------------------------------------------------------
--  DDL for Trigger VALID_BAND_RESULTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_BAND_RESULTS_BI" 
before insert
on VALID_BAND_RESULTS
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');

           --

   insert into VALID_BAND_RESULTS_AUDIT
    (
	TEST_ID, RESULT, RESULT_SEQ,
	RESULT_DESC, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.TEST_ID, :new.RESULT, :new.RESULT_SEQ,
	:new.RESULT_DESC, :new.PROGRAM_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "VALID_BAND_RESULTS_BI" ENABLE;
