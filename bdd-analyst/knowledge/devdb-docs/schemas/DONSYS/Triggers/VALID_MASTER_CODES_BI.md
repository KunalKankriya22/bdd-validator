---
tags:
  - trigger
  - DONSYS
---
# VALID_MASTER_CODES_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_MASTER_CODES|VALID_MASTER_CODES]]
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
    insert into VALID_MASTER_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		code_type,
		code,
		description,
		numeral_value,
		sort_sequence_1,
		sort_sequence_2,
		sort_sequence_3,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.code_type,
		:new.code,
		:new.description,
		:new.numeral_value,
		:new.sort_sequence_1,
		:new.sort_sequence_2,
		:new.sort_sequence_3,
		:new.eff_date,
		:new.term_date
	);
end;
```
