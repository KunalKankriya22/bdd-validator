---
tags:
  - trigger
  - SRVSYS
---
# VALID_DONOR_OVERRIDES_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VALID_DONOR_OVERRIDES|VALID_DONOR_OVERRIDES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_donor_overrides_audit
	(
		product_type,
		donor_decision_code,
		attrib_group,
		attrib_code,
		inter_code,
		inter_type,
		override_desc,
		eff_date,
		term_date,
		last_modified_date,
		program_id,
		audit_key,
		audit_insert_user,
		audit_insert_dats
	)
	values
	(
		:new.product_type,
		:new.donor_decision_code,
		:new.attrib_group,
		:new.attrib_code,
		:new.inter_code,
		:new.inter_type,
		:new.override_desc,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.program_id,
		:new.audit_key,
		lt_user_session.get_userid,
		sysdate
	);
end;
```
