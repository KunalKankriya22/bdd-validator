---
tags:
  - trigger
  - DONSYS
---
# VALID_SEARCH_CRITERION_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_SEARCH_CRITERION|VALID_SEARCH_CRITERION]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_SEARCH_CRITERION_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		criterion_name,
		v_table_name,
		v_column_name,
		default_op,
		enlistment_type,
		criterion_datatype,
		lov_title,
		lov_sql,
		desc_hint_text,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.criterion_name,
		:old.v_table_name,
		:old.v_column_name,
		:old.default_op,
		:old.enlistment_type,
		:old.criterion_datatype,
		:old.lov_title,
		:old.lov_sql,
		:old.desc_hint_text,
		:old.eff_date,
		:old.term_date
	);
end;
```
