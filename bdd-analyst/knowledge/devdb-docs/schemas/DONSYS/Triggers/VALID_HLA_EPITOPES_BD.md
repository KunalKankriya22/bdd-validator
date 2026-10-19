---
tags:
  - trigger
  - DONSYS
---
# VALID_HLA_EPITOPES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HLA_EPITOPES|VALID_HLA_EPITOPES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_HLA_EPITOPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		hla_standard,
		chapter_id,
		public_epitope_id,
		associated_epitope_id,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.hla_standard,
		:old.chapter_id,
		:old.public_epitope_id,
		:old.associated_epitope_id,
		:old.eff_date,
		:old.term_date
	);
end;
```
