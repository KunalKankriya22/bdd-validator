--------------------------------------------------------
--  DDL for Trigger VSERV_RETURN_REASON_BEFORE_UP
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_RETURN_REASON_BEFORE_UP" before update on vserv_return_reasons
 for each row
begin
  :new.program_id := nvl(:new.program_id,'MANUAL-UF');
  insert into vserv_return_reasons_audit
  (
   chapter_id,
   code,
   code_desc,
   location_type,
   cr_ncr,
   eff_date,
   enforce,
   fee_code_1,
   fee_code_2,
   last_modified_date,
   term_date,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
   :new.chapter_id,
   :new.code,
   :new.code_desc,
   :new.location_type,
   :new.cr_ncr,
   :new.eff_date,
   :new.enforce,
   :new.fee_code_1,
   :new.fee_code_2,
   :new.last_modified_date,
   :new.term_date,
   :new.audit_key,
   :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_RETURN_REASON_BEFORE_UP" ENABLE;
