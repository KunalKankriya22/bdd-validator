---
tags:
  - trigger
  - SBCSYS
---
# VABOSLD_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ABO_POOLED_SLD|VALID_ABO_POOLED_SLD]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_abo_pooled_sld_audit
	(
		apos, aneg, bpos, bneg,
		abpos, abneg, opos, oneg,
		pool_sld, eff_date, term_date,
		unit_scheme_type, rh_label_flag,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.apos, :old.aneg, :old.bpos, :old.bneg,
		:old.abpos, :old.abneg, :old.opos, :old.aneg,
		:old.pool_sld, :old.eff_date,:old.term_date,
		:old.unit_scheme_type, :old.rh_label_flag,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
