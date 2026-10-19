--------------------------------------------------------
--  DDL for Trigger LABELING_TEST_MESSAGE_MAP_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LABELING_TEST_MESSAGE_MAP_BD" 
BEFORE DELETE
ON SBCSYS.LABELING_TEST_MESSAGE_MAP
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

	insert into LABELING_TEST_MESSAGE_MAP_ADT
    (
        LT_TEST_ID, RESULT_CODE, DISPLY_TEST_ID,
        MESSAGE_DESC, EFF_DATE, INSERT_DATE,
	INSERT_USER,PROGRAM_ID, AUDIT_KEY, TERM_DATE,
	AUDIT_USER,AUDIT_DATE
    )
    values
    (
        :old.LT_TEST_ID, :old.RESULT_CODE, :old.DISPLY_TEST_ID,
        :old.MESSAGE_DESC, :old.EFF_DATE, :old.INSERT_DATE,
	:old.INSERT_USER, :old.PROGRAM_ID, :old.AUDIT_KEY, :old.TERM_DATE,
	lt_user_session.get_userid, sysdate
    );
end;
/
ALTER TRIGGER "LABELING_TEST_MESSAGE_MAP_BD" ENABLE;
