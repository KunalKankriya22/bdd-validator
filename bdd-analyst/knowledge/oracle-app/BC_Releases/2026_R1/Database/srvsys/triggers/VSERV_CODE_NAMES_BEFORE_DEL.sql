--------------------------------------------------------
--  DDL for Trigger VSERV_CODE_NAMES_BEFORE_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CODE_NAMES_BEFORE_DEL" before delete
 on vserv_code_names
for each row
begin
  insert into vserv_code_names_audit
  (
   chapter_id,
   appl_custody,
   code_type,
   code_type_desc,
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
    :old.chapter_id,
    :old.appl_custody,
    :old.code_type,
    :old.code_type_desc,
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
ALTER TRIGGER "VSERV_CODE_NAMES_BEFORE_DEL" ENABLE;
