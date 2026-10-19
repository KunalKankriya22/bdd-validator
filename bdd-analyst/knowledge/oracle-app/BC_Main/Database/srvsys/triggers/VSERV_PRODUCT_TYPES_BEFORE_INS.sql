--------------------------------------------------------
--  DDL for Trigger VSERV_PRODUCT_TYPES_BEFORE_INS
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_PRODUCT_TYPES_BEFORE_INS" before insert
on vserv_product_types for each row
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
   from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL-IN');
  insert into vserv_product_types_audit
  (
   product_type,
   product_type_short_name,
   product_type_desc,
   life_span_ind,
   life_span,
   std_price,
   min_temp,
   max_temp,
   eff_date,
   term_date,
   last_modified_date,
   sort_sequence,
   product_grouping,
   abo_only,
   pool_product,
   special_product_type,
   ship_any_rh,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.product_type,
    :new.product_type_short_name,
    :new.product_type_desc,
    :new.life_span_ind,
    :new.life_span,
    :new.std_price,
    :new.min_temp,
    :new.max_temp,
    :new.eff_date,
    :new.term_date,
    :new.last_modified_date,
    :new.sort_sequence,
    :new.product_grouping,
    :new.abo_only,
    :new.pool_product,
    :new.special_product_type,
    :new.ship_any_rh,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_PRODUCT_TYPES_BEFORE_INS" ENABLE;
