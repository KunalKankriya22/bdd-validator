---
tags:
  - trigger
  - DONSYS
---
# VALID_CHECKOUT_ITEMS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_CHECKOUT_ITEMS|VALID_CHECKOUT_ITEMS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_CHECKOUT_ITEMS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		donation_type,
		chapter_id,
		item_id,
		description,
		sort_sequence,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.donation_type,
		:old.chapter_id,
		:old.item_id,
		:old.description,
		:old.sort_sequence,
		:old.eff_date,
		:old.term_date
	);
end;
```
