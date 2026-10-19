---
tags:
  - trigger
  - DONSYS
---
# VALID_HLA_LOCUS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HLA_LOCUS|VALID_HLA_LOCUS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_HLA_LOCUS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		epitope_id,
		chapter_id,
		locus,
		epitope_super_id,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.epitope_id,
		:old.chapter_id,
		:old.locus,
		:old.epitope_super_id,
		:old.eff_date,
		:old.term_date
	);
end;
```
