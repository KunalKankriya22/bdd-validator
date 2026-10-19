---
tags:
  - trigger
  - SBCSYS
---
# FR_PROD_PROC_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/FR_VPRODUCT_PROCESSES|FR_VPRODUCT_PROCESSES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into fr_vproduct_processes_audit
	(
		process_code, product_code,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.process_code,:old.product_code,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
```
