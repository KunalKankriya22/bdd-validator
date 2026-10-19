--------------------------------------------------------
--  DDL for Trigger VSERV_BOX_CAPACT_BEFORE_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_BOX_CAPACT_BEFORE_DEL" before delete
 on VSERV_BOX_CAPACITY
for each row
begin
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
    :old.box_type,
    :old.product_type,
    :old.capacity,
    :old.eff_date,
    :old.term_date,
    :old.last_modified_date,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_BOX_CAPACT_BEFORE_DEL" ENABLE;
