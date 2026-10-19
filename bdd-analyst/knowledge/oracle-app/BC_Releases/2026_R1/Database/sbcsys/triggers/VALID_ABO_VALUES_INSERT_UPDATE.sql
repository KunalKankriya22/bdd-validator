--------------------------------------------------------
--  DDL for Trigger VALID_ABO_VALUES_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ABO_VALUES_INSERT_UPDATE" 
before insert  or update
on valid_abo_values
for each row
declare
temp_audit_key	  number(23);
begin
if inserting
then
select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
:new.audit_key := temp_audit_key;
end if;
:new.program_id := nvl(:new.program_id,'MANUAL');
:new.last_modified_date := sysdate;
--
insert into valid_abo_values_audit
(
tested_abo_code,
identifier_code,
abo_label,
abo_short_name,
abo_label_type,
abo_only,
alternate_tested_abo,
unit_scheme_type,
eff_date,
term_date,
last_modified_date,
audit_key,
program_id,
audit_insert_dats,
audit_insert_user,
label_printer_code
)
values
(
:new.tested_abo_code,
:new.identifier_code,
:new.abo_label,
:new.abo_short_name,
:new.abo_label_type,
:new.abo_only,
:new.alternate_tested_abo,
:new.unit_scheme_type,
:new.eff_date,
:new.term_date,
:new.last_modified_date,
:new.audit_key,
:new.program_id,
sysdate,
lt_user_session.get_userid,
:new.label_printer_code
);
end;
/
ALTER TRIGGER "VALID_ABO_VALUES_INSERT_UPDATE" ENABLE;
