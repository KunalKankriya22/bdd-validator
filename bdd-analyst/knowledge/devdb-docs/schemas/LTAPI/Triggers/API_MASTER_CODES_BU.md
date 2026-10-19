---
tags:
  - trigger
  - LTAPI
---
# API_MASTER_CODES_BU

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_MASTER_CODES|API_MASTER_CODES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into API_MASTER_CODES_audit
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.code_type,
		:new.code,
		:new.description,
		:new.numeral_value,
		:new.sort_sequence_1,
		:new.sort_sequence_2,
		:new.sort_sequence_3,
		:new.eff_date,
		:new.term_date
	);
end;
```
