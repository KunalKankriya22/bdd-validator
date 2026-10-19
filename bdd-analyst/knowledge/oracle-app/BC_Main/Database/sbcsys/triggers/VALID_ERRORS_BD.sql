--------------------------------------------------------
--  DDL for Trigger VALID_ERRORS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ERRORS_BD" 
BEFORE DELETE
ON "VALID_ERRORS_LAB"
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin

    insert into VALID_ERRORS_AUDIT
    (
	ERROR_CODE, ERROR_TYPE,
	ERROR, AUDIT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.ERROR_CODE, :old.ERROR_TYPE,
	:old.ERROR, :old.AUDIT_FLAG,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "VALID_ERRORS_BD" ENABLE;
