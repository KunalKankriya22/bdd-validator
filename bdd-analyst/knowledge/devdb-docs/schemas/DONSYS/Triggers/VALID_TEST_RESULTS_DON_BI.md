---
tags:
  - trigger
  - DONSYS
---
# VALID_TEST_RESULTS_DON_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_TEST_RESULTS_DON|VALID_TEST_RESULTS_DON]]
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
   	where table_name='VALID_TEST_RESULTS_DON' and sysdate between nvl(eff_date,sysdate)
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
    insert into VALID_TEST_RESULTS_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id,
		chapter_id,
		result_code,
		inter_code,
		notification_type,
		attrib_table,
		attrib_code,
		confirm_test1,
		confirm_test2,
		confirm_test3,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.test_id,
		:new.chapter_id,
		:new.result_code,
		:new.inter_code,
		:new.notification_type,
		:new.attrib_table,
		:new.attrib_code,
		:new.confirm_test1,
		:new.confirm_test2,
		:new.confirm_test3,
		:new.eff_date,
		:new.term_date
	);
end;
```
