--------------------------------------------------------
--  DDL for Trigger RGT_TESTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TESTS_BI" 
before insert
on RGT_TESTS
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
        --
    end;
/
ALTER TRIGGER "RGT_TESTS_BI" ENABLE;
