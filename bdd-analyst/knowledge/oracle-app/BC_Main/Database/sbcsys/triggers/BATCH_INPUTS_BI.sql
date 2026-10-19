--------------------------------------------------------
--  DDL for Trigger BATCH_INPUTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "BATCH_INPUTS_BI" 
before insert
on BATCH_INPUTS
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
        --
    end;
/
ALTER TRIGGER "BATCH_INPUTS_BI" ENABLE;
