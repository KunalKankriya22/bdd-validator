--------------------------------------------------------
--  DDL for Trigger VALID_ERRORS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ERRORS_BU" 
BEFORE UPDATE
OF ERROR_CODE
  ,ERROR_TYPE
  ,ERROR
  ,AUDIT_FLAG  ON "VALID_ERRORS_LAB"
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    VALID_ERRORS_aud	      VALID_ERRORS_AUDIT%rowtype;
begin
    VALID_ERRORS_aud.audit_key := :old.audit_key;
     if nvl(:old.ERROR_CODE,'*') !=
       nvl(:new.ERROR_CODE,'*')
    then
       VALID_ERRORS_aud.ERROR_CODE:= nvl(:new.ERROR_CODE,'*');
    end if;
    if nvl(:old.ERROR_TYPE,'*') !=
       nvl(:new.ERROR_TYPE,'*')
    then
       VALID_ERRORS_aud.ERROR_TYPE:= nvl(:new.ERROR_TYPE,'*');
    end if;
    if nvl(:old.ERROR,'*') !=
       nvl(:new.ERROR,'*')
    then
       VALID_ERRORS_aud.ERROR:= nvl(:new.ERROR,'*');
    end if;
    if nvl(:old.AUDIT_FLAG,'*') !=
       nvl(:new.AUDIT_FLAG,'*')
    then
       VALID_ERRORS_aud.AUDIT_FLAG:= nvl(:new.AUDIT_FLAG,'*');
    end if;


    --
    insert into VALID_ERRORS_AUDIT
    (
	ERROR_CODE, ERROR_TYPE,
	ERROR, AUDIT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	VALID_ERRORS_aud.ERROR_CODE, VALID_ERRORS_aud.ERROR_TYPE,
	VALID_ERRORS_aud.ERROR, VALID_ERRORS_aud.AUDIT_FLAG,
	VALID_ERRORS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "VALID_ERRORS_BU" ENABLE;
