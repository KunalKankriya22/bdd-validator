--------------------------------------------------------
--  DDL for Trigger VALID_ATTRIB_EQUIP_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ATTRIB_EQUIP_DELETE" 
before delete
on valid_attrib_equip
for each row
begin
insert into  valid_attrib_equip_audit (
      attrib_group ,
      attrib_code  ,
      equip_type   ,
      parm_code    ,
      eff_date	   ,
      last_modified_date,
      term_date    ,
      audit_key    ,
      program_id   ,
      audit_insert_user,
      audit_insert_date )
      values (
      :old.attrib_group ,
      :old.attrib_code	,
      :old.equip_type	,
      :old.parm_code	,
      :old.eff_date	,
      :old.last_modified_date,
      :old.term_date	,
      :old.audit_key	,
      :old.program_id, lt_user_session.get_userid,
      sysdate);
end;
/
ALTER TRIGGER "VALID_ATTRIB_EQUIP_DELETE" ENABLE;
