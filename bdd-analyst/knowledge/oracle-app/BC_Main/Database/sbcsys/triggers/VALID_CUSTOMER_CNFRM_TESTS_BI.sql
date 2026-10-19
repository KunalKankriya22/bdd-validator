--------------------------------------------------------
--  DDL for Trigger VALID_CUSTOMER_CNFRM_TESTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CUSTOMER_CNFRM_TESTS_BI" 
before insert
on SBCSYS.valid_customer_confirm_tests
for each row
begin
  if :new.program_id is null then
    :new.program_id := 'MANUAL';
  end if;

  if :new.insert_user is null then
     select lt_user_session.get_userid into :new.insert_user
       from dual ;
  end if;

  if :new.insert_date is null then
     :new.insert_date := sysdate;
  end if;

  if :new.audit_key is null then
     select audit_seq_lab.nextval into :new.audit_key from dual;
  end if;

end ;




/
ALTER TRIGGER "VALID_CUSTOMER_CNFRM_TESTS_BI" ENABLE;
