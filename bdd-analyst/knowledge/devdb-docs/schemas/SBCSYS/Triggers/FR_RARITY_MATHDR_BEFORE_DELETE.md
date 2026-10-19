---
tags:
  - trigger
  - SBCSYS
---
# FR_RARITY_MATHDR_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/FR_VRARITY_MATRIX_HDR|FR_VRARITY_MATRIX_HDR]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into fr_vrarity_matrix_hdr_audit
	(
		matrix_id, rarity_percent,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.matrix_id,:old.rarity_percent,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
```
