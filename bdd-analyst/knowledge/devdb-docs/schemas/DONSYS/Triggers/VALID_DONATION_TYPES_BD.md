---
tags:
  - trigger
  - DONSYS
---
# VALID_DONATION_TYPES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_DONATION_TYPES|VALID_DONATION_TYPES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_DONATION_TYPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		donation_type,
		chapter_id,
		description,
		test_needed_flag,
		sort_sequence,
		donation_type_group,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.donation_type,
		:old.chapter_id,
		:old.description,
		:old.test_needed_flag,
		:old.sort_sequence,
		:old.donation_type_group,
		:old.eff_date,
		:old.term_date
	);
end;
```
