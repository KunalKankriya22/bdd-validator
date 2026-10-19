--------------------------------------------------------
--  DDL for Trigger RGT_PARM_TESTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_PARM_TESTS_BD" 
BEFORE DELETE
ON SBCSYS.RGT_PARM_TESTS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

	insert into RGT_PARM_TESTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, TEST_ID,
	PARM_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.TEST_ID,
	:old.PARM_ID, :old.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_PARM_TESTS_BD" ENABLE;
