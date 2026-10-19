---
tags:
  - trigger
  - DONSYS
---
# PHYSICAL_FINDINGS_TEMPLATE_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/PHYSICAL_FINDINGS_TEMPLATE|PHYSICAL_FINDINGS_TEMPLATE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into PHY_FINDINGS_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		template_id,
		chapter_id,
		donation_type,
		physical_code,
		procedure_code,
		sort_sequence,
		data_type,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.template_id,
		:old.chapter_id,
		:old.donation_type,
		:old.physical_code,
		:old.procedure_code,
		:old.sort_sequence,
		:old.data_type,
		:old.eff_date,
		:old.term_date
	);
end;
```
