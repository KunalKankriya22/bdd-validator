---
tags:
  - trigger
  - DONSYS
---
# VALID_OPERATORS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_OPERATORS|VALID_OPERATORS]]
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
    insert into VALID_OPERATORS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		v_operator,
		v_description,
		v_value_style,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.v_operator,
		:new.v_description,
		:new.v_value_style,
		:new.eff_date,
		:new.term_date
	);
end;
```
