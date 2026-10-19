---
tags:
  - trigger
  - DONSYS
---
# VALID_HLA_LOCUS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HLA_LOCUS|VALID_HLA_LOCUS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.epitope_id,
		:new.chapter_id,
		:new.locus,
		:new.epitope_super_id,
		:new.eff_date,
		:new.term_date
	);
end;
```
