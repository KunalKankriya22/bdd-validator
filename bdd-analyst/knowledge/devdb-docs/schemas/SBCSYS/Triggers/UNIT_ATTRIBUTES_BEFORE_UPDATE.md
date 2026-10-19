---
tags:
  - trigger
  - SBCSYS
---
# UNIT_ATTRIBUTES_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_ATTRIBUTES|UNIT_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    aud_rec	      unit_attributes_audit%rowtype;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
    --
	if nvl(:old.attrib_group,'*') !=
       nvl(:new.attrib_group,'*')
    then
       aud_rec.attrib_group := nvl(:new.attrib_group,'*');
    end if;
    if nvl(:old.attrib_code,'*') !=
       nvl(:new.attrib_code,'*')
    then
       aud_rec.attrib_code := nvl(:new.attrib_code,'*');
    end if;
    if nvl(:old.source_test_id,'*') !=
       nvl(:new.source_test_id,'*')
    then
       aud_rec.source_test_id := nvl(:new.source_test_id,'*');
    end if;
    if nvl(:old.status_flag,'*') !=
       nvl(:new.status_flag,'*')
    then
       aud_rec.status_flag := nvl(:new.status_flag,'*');
    end if;
    if nvl(:old.stop_label_flag,'*') !=
       nvl(:new.stop_label_flag,'*')
    then
       aud_rec.stop_label_flag := nvl(:new.stop_label_flag,'*');
    end if;
    --
	insert into unit_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		attrib_group, attrib_code, source_test_id,
		status_flag, stop_label_flag,
		insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		aud_rec.unit_id, aud_rec.coll_date, aud_rec.chapter_id,
		aud_rec.attrib_group, aud_rec.attrib_code, aud_rec.source_test_id,
		aud_rec.status_flag, aud_rec.stop_label_flag,
		aud_rec.insert_dats, aud_rec.insert_user_id,
		aud_rec.audit_key,aud_rec.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
