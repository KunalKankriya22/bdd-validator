--------------------------------------------------------
--  DDL for Trigger VALID_REGINT_REASONS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_REGINT_REASONS_BD" 
 BEFORE DELETE
 ON VALID_REGINT_REASONS
 FOR EACH ROW
BEGIN
insert into VALID_REGINT_REASONS_audit
(
audit_key,
audit_insert_date,
program_id,
audit_insert_user,
inter_reason,
inter_code,
eff_date,
term_date
)
values
(
:old.audit_key,
sysdate,
'DELETE',
decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
:old.inter_reason,
:old.inter_code,
:old.eff_date,
:old.term_date
);
end;
/
ALTER TRIGGER "DONSYS"."VALID_REGINT_REASONS_BD" ENABLE;
