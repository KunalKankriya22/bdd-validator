--------------------------------------------------------
--  DDL for Trigger RGT_UNITS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_UNITS_BD" 
BEFORE DELETE
ON SBCSYS.RGT_UNITS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

	insert into RGT_UNITS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, BATCH_ID,
	UNIT_ID, PROFILE_TESTS, STAT_TESTS,
	UPLOAD_STATUS, COLL_DATE, COLLECTION_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.BATCH_ID,
	:old.UNIT_ID, :old.PROFILE_TESTS, :old.STAT_TESTS,
	:old.UPLOAD_STATUS, :old.COLL_DATE, :old.COLLECTION_DATE,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_UNITS_BD" ENABLE;
