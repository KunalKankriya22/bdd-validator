---
tags:
  - trigger
  - DONSYS
---
# VALID_HH_QUESTIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HH_QUESTIONS|VALID_HH_QUESTIONS]]
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
   	where table_name='VALID_HH_QUESTIONS' and sysdate between nvl(eff_date,sysdate)
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
    insert into DONSYS.VALID_HH_QUESTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		question_code,
		chapter_id,
		gender,
		question_description,
		eff_date,
		term_date,
		REF_CODE,
		READ_MORE_FLAG,
		MANUAL_AUDIT_FLAG,
		MANUAL_AUDIT_HIST_FLAG,
		VARIABLE_DATE,
		DATE_PERIOD_TYPE,
		DATE_PERIOD_NUMBER
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.question_code,
		:new.chapter_id,
		:new.gender,
		:new.question_description,
		:new.eff_date,
		:new.term_date,
		:new.REF_CODE,
		:new.READ_MORE_FLAG,
		:new.MANUAL_AUDIT_FLAG,
		:new.MANUAL_AUDIT_HIST_FLAG,
		:new.VARIABLE_DATE,
		:new.DATE_PERIOD_TYPE,
		:new.DATE_PERIOD_NUMBER
	);
end;
```
