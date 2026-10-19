---
tags:
  - trigger
  - SRVSYS
---
# VSERV_PRODUCT_TYPES_BEFORE_DEL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_PRODUCT_TYPES|VSERV_PRODUCT_TYPES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
    :old.product_type,
    :old.product_type_short_name,
    :old.product_type_desc,
    :old.life_span_ind,
    :old.life_span,
    :old.std_price,
    :old.min_temp,
    :old.max_temp,
    :old.eff_date,
    :old.term_date,
    :old.last_modified_date,
    :old.sort_sequence,
    :old.product_grouping,
    :old.abo_only,
    :old.pool_product,
    :old.special_product_type,
    :old.ship_any_rh,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
