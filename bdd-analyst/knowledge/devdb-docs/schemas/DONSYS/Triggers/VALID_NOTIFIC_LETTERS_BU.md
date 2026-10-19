---
tags:
  - trigger
  - DONSYS
---
# VALID_NOTIFIC_LETTERS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_NOTIFIC_LETTERS|VALID_NOTIFIC_LETTERS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_NOTIFIC_LETTERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		inter_code,
		chapter_id,
		donation_type,
		letter_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.inter_code,
		:new.chapter_id,
		:new.donation_type,
		:new.letter_id,
		:new.eff_date,
		:new.term_date
	);
end;
```
