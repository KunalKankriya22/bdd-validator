---
tags:
  - trigger
  - SBCSYS
---
# CUE_CODES_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/DONOR_DECISION_CODES|DONOR_DECISION_CODES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into donor_decision_codes_audit
	(
		donor_decision_code,bar_code_value,
		eff_date,term_date,last_modified_date,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.donor_decision_code,:old.bar_code_value,
		:old.eff_date,:old.term_date,:old.last_modified_date,
		:old.audit_key,'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
