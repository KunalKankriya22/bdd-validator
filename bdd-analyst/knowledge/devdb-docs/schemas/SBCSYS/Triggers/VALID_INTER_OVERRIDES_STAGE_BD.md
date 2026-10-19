---
tags:
  - trigger
  - SBCSYS
---
# VALID_INTER_OVERRIDES_STAGE_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INTER_OVERRIDES_STAGE|VALID_INTER_OVERRIDES_STAGE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_inter_over_stage_audit
	(
		product_type,
		donor_decision_code,
		inter_code,
		inter_type,
		eff_date,
		term_date,
		last_modified_date,
		move_date,
		program_id,
		audit_key,
		audit_insert_user,
		audit_insert_dats
	)
	values
	(
		:old.product_type,
		:old.donor_decision_code,
		:old.inter_code,
		:old.inter_type,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		:old.move_date,
		'DELETE',
		:old.audit_key,
		lt_user_session.get_userid,
		sysdate
	);
end;
```
