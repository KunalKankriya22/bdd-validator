--------------------------------------------------------
--  DDL for Trigger RGT_CONTRACT_PROFILE_INS_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_CONTRACT_PROFILE_INS_UPD" 
  before insert or update on RGT_CONTRACT_PROFILE
  for each row
declare
  temp_audit_key number(23);
begin
  if inserting then
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
  end if;
  :new.program_id := nvl(:new.program_id, 'MANUAL');
end;
/
ALTER TRIGGER "RGT_CONTRACT_PROFILE_INS_UPD" ENABLE;
