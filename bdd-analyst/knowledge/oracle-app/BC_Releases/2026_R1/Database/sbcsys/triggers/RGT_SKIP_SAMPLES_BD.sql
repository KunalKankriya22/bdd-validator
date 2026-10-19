--------------------------------------------------------
--  DDL for Trigger RGT_SKIP_SAMPLES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_SKIP_SAMPLES_BD" 
BEFORE DELETE
ON SBCSYS.RGT_SKIP_SAMPLES
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

	insert into RGT_SKIP_SAMPLES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, UNIT_ID,
	COLL_DATE, SKIP_FLAG, INSERT_DATE,
	INSERT_USER_ID, REASON_CODE, RESET_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.UNIT_ID,
	:old.COLL_DATE, :old.SKIP_FLAG, :old.INSERT_DATE,
	:old.INSERT_USER_ID, :old.REASON_CODE, :old.RESET_DATE,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_SKIP_SAMPLES_BD" ENABLE;
