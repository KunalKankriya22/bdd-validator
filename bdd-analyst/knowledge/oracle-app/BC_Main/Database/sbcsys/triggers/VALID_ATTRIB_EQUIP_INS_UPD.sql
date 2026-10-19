--------------------------------------------------------
--  DDL for Trigger VALID_ATTRIB_EQUIP_INS_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ATTRIB_EQUIP_INS_UPD" 
before insert  or update
on valid_attrib_equip
for each row
declare
      temp_audit_key	number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
insert into  valid_attrib_equip_audit (
      attrib_group ,
      attrib_code  ,
      equip_type   ,
      parm_code,
      eff_date	   ,
      last_modified_date,
      term_date    ,
      audit_key    ,
      program_id   ,
      audit_insert_user,
      audit_insert_date )
      values (
      :new.attrib_group ,
      :new.attrib_code	,
      :new.equip_type	,
      :new.parm_code	,
      :new.eff_date	,
      :new.last_modified_date ,
      :new.term_date	,
      :new.audit_key	,
      :new.program_id, lt_user_session.get_userid,
      sysdate);
end;
/
ALTER TRIGGER "VALID_ATTRIB_EQUIP_INS_UPD" ENABLE;
