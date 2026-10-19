--------------------------------------------------------
--  DDL for Trigger VSERV_MASTER_BEFORE_UP
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_MASTER_BEFORE_UP" before update on vserv_master for each row
begin
  :new.program_id := nvl(:new.program_id,'MANUAL-UF');
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
   :new.code_type,
   :new.code,
   :new.code_desc,
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
ALTER TRIGGER "VSERV_MASTER_BEFORE_UP" ENABLE;
