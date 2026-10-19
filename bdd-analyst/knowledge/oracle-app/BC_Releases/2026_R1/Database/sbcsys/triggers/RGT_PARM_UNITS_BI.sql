--------------------------------------------------------
--  DDL for Trigger RGT_PARM_UNITS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_PARM_UNITS_BI" 
before insert
on RGT_PARM_UNITS
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
           --
    insert into RGT_PARM_UNITS_AUDIT
    (
	CHAPTER_ID, UNIT_ID, PARM_ID,
	CONTRACT_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.UNIT_ID, :new.PARM_ID,
	:new.CONTRACT_ID, :new.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_PARM_UNITS_BI" ENABLE;
