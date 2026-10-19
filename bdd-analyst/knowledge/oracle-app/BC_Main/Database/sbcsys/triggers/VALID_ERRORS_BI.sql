--------------------------------------------------------
--  DDL for Trigger VALID_ERRORS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ERRORS_BI" 
before insert
on "VALID_ERRORS_LAB"
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;

           --

    insert into VALID_ERRORS_AUDIT
    (
	ERROR_CODE, ERROR_TYPE,
	ERROR, AUDIT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.ERROR_CODE, :new.ERROR_TYPE,
	:new.ERROR, :new.AUDIT_FLAG,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "VALID_ERRORS_BI" DISABLE;
