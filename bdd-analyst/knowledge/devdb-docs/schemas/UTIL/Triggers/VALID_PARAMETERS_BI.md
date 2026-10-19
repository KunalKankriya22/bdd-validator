---
tags:
  - trigger
  - UTIL
---
# VALID_PARAMETERS_BI

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_PARAMETERS|VALID_PARAMETERS]]
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
   	where table_name='VALID_PARAMETERS' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into VALID_PARAMETERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		parameter_code,
		chapter_id,
		parameter_type,
		parameter_value,
		description,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.parameter_code,
		:new.chapter_id,
		:new.parameter_type,
		:new.parameter_value,
		:new.description,
		:new.eff_date,
		:new.term_date
	);
end;
```
