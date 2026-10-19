---
tags:
  - trigger
  - DONSYS
---
# VALID_LETTERS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_LETTERS|VALID_LETTERS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_LETTERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		letter_id,
		version_no,
		letter_code,
		letter_title,
		version_date,
		document_name,
		datafile_name,
		document_type,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.letter_id,
		:old.version_no,
		:old.letter_code,
		:old.letter_title,
		:old.version_date,
		:old.document_name,
		:old.datafile_name,
		:old.document_type,
		:old.eff_date,
		:old.term_date
	);
end;
```
