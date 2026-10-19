--------------------------------------------------------
--  DDL for Trigger VALID_REGINT_REASONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_REGINT_REASONS_BI" 
 BEFORE INSERT
 ON VALID_REGINT_REASONS
 FOR EACH ROW
DECLARE
temp_audit_key	  number(23);
begin
select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
into :new.insert_user from dual ;
:new.insert_date := sysdate ;
select audit_seq.nextval into temp_audit_key from dual;
:new.audit_key := temp_audit_key;
:new.program_id := nvl(:new.program_id,'MANUAL');
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
:new.insert_user,
:new.inter_reason,
:new.inter_code,
:new.eff_date,
:new.term_date
);
end;
/
ALTER TRIGGER "DONSYS"."VALID_REGINT_REASONS_BI" ENABLE;
