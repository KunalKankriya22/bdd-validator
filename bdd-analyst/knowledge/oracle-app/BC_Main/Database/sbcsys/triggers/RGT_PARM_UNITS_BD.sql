--------------------------------------------------------
--  DDL for Trigger RGT_PARM_UNITS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_PARM_UNITS_BD" 
BEFORE DELETE
ON SBCSYS.RGT_PARM_UNITS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

	insert into RGT_PARM_UNITS_AUDIT
    (
	CHAPTER_ID, UNIT_ID, PARM_ID,
	CONTRACT_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.UNIT_ID, :old.PARM_ID,
	:old.CONTRACT_ID, :old.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_PARM_UNITS_BD" ENABLE;
