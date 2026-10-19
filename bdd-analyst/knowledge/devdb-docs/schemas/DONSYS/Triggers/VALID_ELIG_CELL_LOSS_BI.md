---
tags:
  - trigger
  - DONSYS
---
# VALID_ELIG_CELL_LOSS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ELIG_CELL_LOSS|VALID_ELIG_CELL_LOSS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_ELIG_CELL_LOSS' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into valid_elig_cell_loss_audit
	(
		chapter_id,
		cell_type,
		maximum_loss,
		days_between,
		eff_date,
		term_date,
		insert_user,
		insert_date,
		program_id,
		audit_key,
		audit_insert_dats
	)
	values
	(
		:new.chapter_id,
		:new.cell_type,
		:new.maximum_loss,
		:new.days_between,
		:new.eff_date,
		:new.term_date,
		:new.insert_user,
		:new.insert_date,
		:new.program_id,
		:new.audit_key,
		sysdate
	);
end;
```
