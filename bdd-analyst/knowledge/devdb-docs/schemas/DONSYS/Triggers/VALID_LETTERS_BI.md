---
tags:
  - trigger
  - DONSYS
---
# VALID_LETTERS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_LETTERS|VALID_LETTERS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.letter_id,
		:new.version_no,
		:new.letter_code,
		:new.letter_title,
		:new.version_date,
		:new.document_name,
		:new.datafile_name,
		:new.document_type,
		:new.eff_date,
		:new.term_date
	);
end;
```
