--------------------------------------------------------
--  DDL for Trigger VALID_PRODUCTS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PRODUCTS_INSERT_UPDATE" 
before insert  or update
on valid_products
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
    insert into valid_products_audit
	(
		product_code,product_short_name,product_type,
		dummy_product_flag,
		product_desc,life_span_ind,life_span,max_temp,
		min_temp,min_weight,max_weight,
		specific_gravity, product_count,
		max_bleed_time, time_limit,
		oft_flag,rh_label_flag,eff_date,term_date,
		last_modified_date,audit_key,
		program_id, audit_insert_dats, audit_insert_user,
		inventory_class,pool_product_code,std_price,
		out_of_state_flag,service_code,returnable,inv_product_type,
		pheresis_flag, cell_count_flag,
		unit_scheme_type, product_formula, preprinted_label_flag,
		comp_product_code, manuf_product_flag
	)
	values
	(
		:new.product_code,:new.product_short_name,:new.product_type,
		:new.dummy_product_flag,
		:new.product_desc,:new.life_span_ind,:new.life_span,:new.max_temp,
		:new.min_temp,:new.min_weight,:new.max_weight,
		:new.specific_gravity, :new.product_count,
		:new.max_bleed_time, :new.time_limit,
		:new.oft_flag,:new.rh_label_flag,:new.eff_date,:new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid,
		:new.inventory_class,:new.pool_product_code,:new.std_price,
		:new.out_of_state_flag,:new.service_code,:new.returnable,
		:new.inv_product_type, :new.pheresis_flag, :new.cell_count_flag,
		:new.unit_scheme_type, :new.product_formula,
		:new.preprinted_label_flag, :new.comp_product_code,
		:new.manuf_product_flag
	);
end;
/
ALTER TRIGGER "VALID_PRODUCTS_INSERT_UPDATE" ENABLE;
