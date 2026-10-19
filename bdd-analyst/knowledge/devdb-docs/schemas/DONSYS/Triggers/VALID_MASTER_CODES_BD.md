---
tags:
  - trigger
  - DONSYS
---
# VALID_MASTER_CODES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_MASTER_CODES|VALID_MASTER_CODES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_MASTER_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		code_type,
		code,
		description,
		numeral_value,
		sort_sequence_1,
		sort_sequence_2,
		sort_sequence_3,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.code_type,
		:old.code,
		:old.description,
		:old.numeral_value,
		:old.sort_sequence_1,
		:old.sort_sequence_2,
		:old.sort_sequence_3,
		:old.eff_date,
		:old.term_date
	);
end;
```
