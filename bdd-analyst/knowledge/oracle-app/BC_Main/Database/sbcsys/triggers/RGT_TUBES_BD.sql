--------------------------------------------------------
--  DDL for Trigger RGT_TUBES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TUBES_BD" 
BEFORE DELETE
ON SBCSYS.RGT_TUBES
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

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
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.CBC_UNIT_ID,
	:old.UNIT_ID, :old.TUBE_CHECK_IN_DATE, :old.RED1_FLAG,
	:old.RED2_FLAG, :old.PURPLE1_FLAG, :old.PURPLE2_FLAG,
	:old.PROGRAM_ID, :old.BATCH_ID, :old.USER_ID,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_TUBES_BD" ENABLE;
