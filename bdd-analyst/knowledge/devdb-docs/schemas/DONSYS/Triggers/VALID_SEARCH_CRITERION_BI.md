---
tags:
  - trigger
  - DONSYS
---
# VALID_SEARCH_CRITERION_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_SEARCH_CRITERION|VALID_SEARCH_CRITERION]]
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
    insert into VALID_SEARCH_CRITERION_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		criterion_name,
		v_table_name,
		v_column_name,
		default_op,
		enlistment_type,
		criterion_datatype,
		lov_title,
		lov_sql,
		desc_hint_text,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.criterion_name,
		:new.v_table_name,
		:new.v_column_name,
		:new.default_op,
		:new.enlistment_type,
		:new.criterion_datatype,
		:new.lov_title,
		:new.lov_sql,
		:new.desc_hint_text,
		:new.eff_date,
		:new.term_date
	);
end;
```
