--------------------------------------------------------
--  DDL for Trigger VALID_PRODEQUIP_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "SBCSYS"."VALID_PRODEQUIP_INSERT_UPDATE" 
before delete
on valid_prodequip_cgmp
for each row
begin
    insert into valid_prodequip_cgmp_audit
   (equip_type, proc, product_code, parm_code, accept_min, accept_max ,
   eff_date, last_modify_date,term_date,audit_key,program_id,
   audit_insert_user,	audit_insert_date  )
   values
   (:old.equip_type, :old.proc, :old.product_code, :old.parm_code,
    :old.accept_min, :old.accept_max ,
    :old.eff_date,  :old.last_modify_date, :old.term_date, :old.audit_key,
    'DELETE', lt_user_session.get_userid,
    sysdate);
end;
ALTER TRIGGER "SBCSYS"."VALID_PRODEQUIP_INSERT_UPDATE" ENABLE
