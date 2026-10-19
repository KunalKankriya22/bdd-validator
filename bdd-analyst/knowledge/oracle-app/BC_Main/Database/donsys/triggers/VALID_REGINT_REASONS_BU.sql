--------------------------------------------------------
--  DDL for Trigger VALID_REGINT_REASONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_REGINT_REASONS_BU" 
 BEFORE UPDATE
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
:new.audit_key,
sysdate,
:new.program_id,
decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
:new.inter_reason,
:new.inter_code,
:new.eff_date,
:new.term_date
);
end;
/
ALTER TRIGGER "DONSYS"."VALID_REGINT_REASONS_BU" ENABLE;
