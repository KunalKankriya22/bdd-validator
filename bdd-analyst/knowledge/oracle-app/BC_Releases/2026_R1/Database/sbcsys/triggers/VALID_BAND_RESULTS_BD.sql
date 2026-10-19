--------------------------------------------------------
--  DDL for Trigger VALID_BAND_RESULTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_BAND_RESULTS_BD" 
BEFORE DELETE
ON SBCSYS.VALID_BAND_RESULTS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

    insert into VALID_BAND_RESULTS_AUDIT
    (
	TEST_ID, RESULT, RESULT_SEQ,
	RESULT_DESC, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.TEST_ID, :old.RESULT, :old.RESULT_SEQ,
	:old.RESULT_DESC, :old.PROGRAM_ID,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "VALID_BAND_RESULTS_BD" ENABLE;
