---
tags:
  - trigger
  - DONSYS
---
# VALID_STRONG_REACTIVITY_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_STRONG_REACTIVITY|VALID_STRONG_REACTIVITY]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_STRONG_REACTIVITY_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		epitope_id_1,
		epitope_id_2,
		chapter_id,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.epitope_id_1,
		:old.epitope_id_2,
		:old.chapter_id,
		:old.eff_date,
		:old.term_date
	);
end;
```
