---
tags:
  - trigger
  - DONSYS
---
# VALID_CRITERION_OPS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_CRITERION_OPS|VALID_CRITERION_OPS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_CRITERION_OPS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		criterion_name,
		criterion_op,
		v_table_name,
		pass_seq,
		table_join,
		title_text,
		field_text_1,
		field_text_2,
		desc_hint_text,
		where_clause,
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
		:old.criterion_op,
		:old.v_table_name,
		:old.pass_seq,
		:old.table_join,
		:old.title_text,
		:old.field_text_1,
		:old.field_text_2,
		:old.desc_hint_text,
		:old.where_clause,
		:old.eff_date,
		:old.term_date
	);
end;
```
