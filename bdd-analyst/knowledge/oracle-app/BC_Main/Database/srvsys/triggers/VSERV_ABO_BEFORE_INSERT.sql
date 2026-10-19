--------------------------------------------------------
--  DDL for Trigger VSERV_ABO_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_ABO_BEFORE_INSERT" before insert on
vserv_abo for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
   from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL-IN');
  insert into vserv_abo_audit
  (
   abo_code,
   abo_desc,
   eff_date,
   last_modified_date,
   abo_entry_1,
   abo_entry_2,
   discard_flag,
   transfusable_flag,
   term_date,
   abo_only,
   abo_seq,
   order_abo_group,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.abo_code,
    :new.abo_desc,
    :new.eff_date,
    :new.last_modified_date,
    :new.abo_entry_1,
    :new.abo_entry_2,
    :new.discard_flag,
    :new.transfusable_flag,
    :new.term_date,
    :new.abo_only,
    :new.abo_seq,
    :new.order_abo_group,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_ABO_BEFORE_INSERT" ENABLE;
