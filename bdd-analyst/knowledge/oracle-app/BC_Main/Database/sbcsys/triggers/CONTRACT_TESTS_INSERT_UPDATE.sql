--------------------------------------------------------
--  DDL for Trigger CONTRACT_TESTS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CONTRACT_TESTS_INSERT_UPDATE" 
  before insert or update on contract_tests
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
  -- MLT 576
  if :new.profile_set_id is null then
     :new.profile_set_id := '0000';
  end if;
  ----

  insert into contract_tests_audit
    (contract_id,
     chapter_id,
     test_id,
     stop_label_flag,
     eff_date,
     term_date,
     last_modified_date,
     audit_key,
     program_id,
     audit_insert_dats,
     audit_insert_user,
     EXTRACT)
  values
    (:new.contract_id,
     :new.chapter_id,
     :new.test_id,
     :new.stop_label_flag,
     :new.eff_date,
     :new.term_date,
     :new.last_modified_date,
     :new.audit_key,
     :new.program_id,
     sysdate,
     lt_user_session.get_userid,
     :new.EXTRACT);
end;

/
ALTER TRIGGER "CONTRACT_TESTS_INSERT_UPDATE" ENABLE;
