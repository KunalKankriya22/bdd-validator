---
tags:
  - trigger
  - SBCSYS
---
# VALID_PRODUCTS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PRODUCTS|VALID_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
		program_id,audit_insert_dats, audit_insert_user,
		inventory_class,pool_product_code,std_price,
		out_of_state_flag,service_code,returnable,inv_product_type,
		pheresis_flag, cell_count_flag,
		unit_scheme_type, product_formula, preprinted_label_flag,
		comp_product_code, manuf_product_flag
	)
	values
	(
		:old.product_code,:old.product_short_name,:old.product_type,
		:old.dummy_product_flag,
		:old.product_desc,:old.life_span_ind,:old.life_span,:old.max_temp,
		:old.min_temp,:old.min_weight,:old.max_weight,
		:old.specific_gravity, :old.product_count,
		:old.max_bleed_time, :old.time_limit,
		:old.oft_flag,:old.rh_label_flag,:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid,
		:old.inventory_class,:old.pool_product_code,:old.std_price,
		:old.out_of_state_flag,:old.service_code,:old.returnable,
		:old.inv_product_type, :old.pheresis_flag, :old.cell_count_flag,
		:old.unit_scheme_type, :old.product_formula,
		:old.preprinted_label_flag, :old.comp_product_code,
		:old.manuf_product_flag
	);
end;
```
