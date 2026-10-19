--------------------------------------------------------
--  DDL for Trigger VSERV_BOX_CAPACT_BEFORE_INS
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_BOX_CAPACT_BEFORE_INS" before insert
 on VSERV_BOX_CAPACITY
for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
   from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL-IN');
  insert into vserv_box_capacity_audit
  (
   box_type,
   product_type,
   capacity,
   eff_date,
   term_date,
   last_modified_date,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.box_type,
    :new.product_type,
    :new.capacity,
    :new.eff_date,
    :new.term_date,
    :new.last_modified_date,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_BOX_CAPACT_BEFORE_INS" ENABLE;
