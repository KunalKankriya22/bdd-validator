---
tags:
  - trigger
  - SBCSYS
---
# FR_RARITY_MATDET_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/FR_VRARITY_MATRIX_DET|FR_VRARITY_MATRIX_DET]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into fr_vrarity_matrix_det_audit
	(
		matrix_id, test_id, test_result,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.matrix_id,:old.test_id, :old.test_result,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
```
