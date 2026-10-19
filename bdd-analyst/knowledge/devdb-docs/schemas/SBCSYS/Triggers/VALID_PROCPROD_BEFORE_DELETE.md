---
tags:
  - trigger
  - SBCSYS
---
# VALID_PROCPROD_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PROCPROD_MATRIX|VALID_PROCPROD_MATRIX]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_procprod_matrix_audit
	( proc, product_type, eff_date, last_modify_date,
	  term_date, audit_key, program_id, audit_insert_Dats,
	  audit_insert_user)
	values
	( :old.proc, :old.product_type, :old.eff_date, :old.last_modify_date,
	  :old.term_date, :old.audit_key, 'DELETE', sysdate,
	  lt_user_session.get_userid);
end;
```
