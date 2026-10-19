---
tags:
  - trigger
  - SBCSYS
---
# VALID_HIV_OBS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_HIV_WB_OBS|VALID_HIV_WB_OBS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_hiv_wb_obs_audit
	(
		result_code, p17, p24,
		p31, gp41, p51, p55, p66,
		p120, p160, eff_date, term_date,
		last_modified_date, audit_key,
		program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.result_code, :old.p17, :old.p24,
		:old.p31, :old.gp41, :old.p51, :old.p55, :old.p66,
		:old.p120, :old.p160, :old.eff_date, :old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE' ,sysdate, lt_user_session.get_userid
	);
end;
```
