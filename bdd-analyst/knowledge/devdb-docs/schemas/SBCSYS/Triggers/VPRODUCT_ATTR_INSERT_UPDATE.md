---
tags:
  - trigger
  - SBCSYS
---
# VPRODUCT_ATTR_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PRODUCT_ATTRIBUTES|VALID_PRODUCT_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
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
    insert into valid_product_attributes_audit
	(
		product_type, attrib_group, attrib_code,
		life_span_ind, life_span,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user,label_flag
	)
	values
	(
		:new.product_type,:new.attrib_group,:new.attrib_code,
		:new.life_span_ind,:new.life_span,
		:new.eff_date,:new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid,:new.label_flag
	);
end;
```
