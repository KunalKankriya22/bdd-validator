---
tags:
  - trigger
  - DONSYS
---
# VALID_WINDOWS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_WINDOWS|VALID_WINDOWS]]
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
   	where table_name='VALID_WINDOWS' and sysdate between nvl(eff_date,sysdate)
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
    insert into VALID_WINDOWS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		window_name,
		chapter_id,
		title,
		appl_id,
		parm_1,
		parm_2,
		parm_3,
		parm_4,
		x_pos,
		y_pos,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.window_name,
		:new.chapter_id,
		:new.title,
		:new.appl_id,
		:new.parm_1,
		:new.parm_2,
		:new.parm_3,
		:new.parm_4,
		:new.x_pos,
		:new.y_pos,
		:new.eff_date,
		:new.term_date
	);
end;
```
