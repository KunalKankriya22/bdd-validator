---
tags:
  - trigger
  - SBCSYS
---
# VATTRIB_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ATTRIBUTES|VALID_ATTRIBUTES]]
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
    insert into valid_attributes_audit
	(
		attrib_group, attrib_code, attrib_desc, price,
		stop_label_flag, status_flag, assign_after_label_flag,
		show_on_label_flag, inter_code, credit_flag, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user,
  		attrib_custom,normal_stock_flag,service_code,
		attrib_label, attrib_abbrev, attrib_position,
		unit_scheme_type, attrib_type, exclusivity_flag,
		EQ_CODE128_ATTRIB_GROUP,EQ_CODE128_ATTRIB_CODE,DELETE_ALLOWED
	)
	values
	(
		:new.attrib_group,:new.attrib_code,:new.attrib_desc,:new.price,
		:new.stop_label_flag,:new.status_flag,
		:new.assign_after_label_flag, :new.show_on_label_flag,
		:new.inter_code, :new.credit_flag, :new.eff_date,
		:new.term_date,:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid,
		:new.attrib_custom,:new.normal_stock_flag,:new.service_code,
		:new.attrib_label, :new.attrib_abbrev, :new.attrib_position,
		:new.unit_scheme_type, :new.attrib_type, :new.exclusivity_flag,
		:new.EQ_CODE128_ATTRIB_GROUP, :new.EQ_CODE128_ATTRIB_CODE, :new.DELETE_ALLOWED
	);
end;



```
