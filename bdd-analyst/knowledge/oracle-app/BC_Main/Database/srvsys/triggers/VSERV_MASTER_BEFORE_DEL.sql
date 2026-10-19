--------------------------------------------------------
--  DDL for Trigger VSERV_MASTER_BEFORE_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_MASTER_BEFORE_DEL" before delete on
vserv_master for each row
begin
  insert into vserv_master_audit
  (
   code_type,
   code,
   code_desc,
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
    :old.code_type,
    :old.code,
    :old.code_desc,
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
ALTER TRIGGER "VSERV_MASTER_BEFORE_DEL" ENABLE;
