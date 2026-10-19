--------------------------------------------------------
--  DDL for Trigger VSERV_PS_MATRIX_BEFORE_UP
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_PS_MATRIX_BEFORE_UP" before update on vserv_ps_matrix
for each row
begin
  :new.program_id := nvl(:new.program_id,'MANUAL-UF');
  insert into vserv_ps_matrix_audit
  (
   chapter_id,
   work_op,
   end_product_type,
   src_product_type,
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
   :new.chapter_id,
   :new.work_op,
   :new.end_product_type,
   :new.src_product_type,
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
ALTER TRIGGER "VSERV_PS_MATRIX_BEFORE_UP" ENABLE;
