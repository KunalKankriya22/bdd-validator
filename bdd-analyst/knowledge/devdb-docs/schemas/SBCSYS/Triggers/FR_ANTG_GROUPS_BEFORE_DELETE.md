---
tags:
  - trigger
  - SBCSYS
---
# FR_ANTG_GROUPS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/FR_VANTIGEN_GROUPS|FR_VANTIGEN_GROUPS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into fr_vantigen_groups_audit
	(
		antigen_group, test_id, test_result,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.antigen_group,:old.test_id,:old.test_result,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
```
