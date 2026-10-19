--------------------------------------------------------
--  DDL for Trigger VSERV_CHARGE_CODES_BEFORE_UP
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CHARGE_CODES_BEFORE_UP" before update on vserv_charge_codes
for each row
begin
  :new.program_id := nvl(:new.program_id,'MANUAL-UF');
  insert into vserv_charge_codes_audit
  (
   chapter_id,
   charge_code,
   charge_code_desc,
   charge_code_type,
   charge,
   eff_date,
   last_modified_date,
   term_date,
   service_code,
   percent_disc_flag,
   ship_flag,
   cr_ncr,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
   :new.chapter_id,
   :new.charge_code,
   :new.charge_code_desc,
   :new.charge_code_type,
   :new.charge,
   :new.eff_date,
   :new.last_modified_date,
   :new.term_date,
   :new.service_code,
   :new.percent_disc_flag,
   :new.ship_flag,
   :new.cr_ncr,
   :new.audit_key,
   :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_CHARGE_CODES_BEFORE_UP" ENABLE;
