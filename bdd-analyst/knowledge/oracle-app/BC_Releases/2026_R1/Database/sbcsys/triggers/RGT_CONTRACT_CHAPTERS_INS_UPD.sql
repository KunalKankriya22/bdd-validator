--------------------------------------------------------
--  DDL for Trigger RGT_CONTRACT_CHAPTERS_INS_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_CONTRACT_CHAPTERS_INS_UPD" 
  before insert or update on RGT_CONTRACT_CHAPTERS
  for each row
declare
  temp_audit_key number(23);
begin
  if inserting then
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
  end if;
  :new.program_id := nvl(:new.program_id, 'MANUAL');
  --:new.last_modified_date := sysdate; -- Commented by Kishore on 05/24/2011. IM 5356
  --
end;
/
ALTER TRIGGER "RGT_CONTRACT_CHAPTERS_INS_UPD" ENABLE;
