---
tags:
  - trigger
  - DONSYS
---
# VALID_NOTIFIC_LETTERS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_NOTIFIC_LETTERS|VALID_NOTIFIC_LETTERS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.inter_code,
		:old.chapter_id,
		:old.donation_type,
		:old.letter_id,
		:old.eff_date,
		:old.term_date
	);
end;
```
