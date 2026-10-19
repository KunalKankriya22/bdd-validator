---
tags:
  - trigger
  - SBCSYS
---
# COMPONENT_SP_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_SP|COMPONENT_SP]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	comp_aud	  component_sp_audit%rowtype;
begin
    comp_aud.audit_key := :old.audit_key;
    comp_aud.program_id := :new.program_id;
    --
    if nvl(:old.patient_id,'*') !=
       nvl(:new.patient_id,'*')
    then
       comp_aud.patient_id := nvl(:new.patient_id,'*');
    end if;
    if nvl(:old.link_unit_id,'*') !=
       nvl(:new.link_unit_id,'*')
    then
       comp_aud.link_unit_id := nvl(:new.link_unit_id,'*');
    end if;
    --
	insert into component_sp_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code,
		process_code, insert_dats,
		insert_user_id, patient_id,
		link_unit_id, note_id,
		audit_key,program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		comp_aud.unit_id, comp_aud.coll_date, comp_aud.chapter_id,
		comp_aud.component_prefix, comp_aud.product_code,
		comp_aud.process_code, comp_aud.insert_dats,
		comp_aud.insert_user_id, comp_aud.patient_id,
		comp_aud.link_unit_id, comp_aud.note_id,
		comp_aud.audit_key,comp_aud.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
