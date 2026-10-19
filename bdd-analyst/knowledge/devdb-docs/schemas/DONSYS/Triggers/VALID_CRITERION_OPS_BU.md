---
tags:
  - trigger
  - DONSYS
---
# VALID_CRITERION_OPS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_CRITERION_OPS|VALID_CRITERION_OPS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.criterion_name,
		:new.criterion_op,
		:new.v_table_name,
		:new.pass_seq,
		:new.table_join,
		:new.title_text,
		:new.field_text_1,
		:new.field_text_2,
		:new.desc_hint_text,
		:new.where_clause,
		:new.eff_date,
		:new.term_date
	);
end;
```
