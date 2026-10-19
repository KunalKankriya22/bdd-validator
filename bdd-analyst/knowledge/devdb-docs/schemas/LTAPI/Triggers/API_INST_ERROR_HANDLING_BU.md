---
tags:
  - trigger
  - LTAPI
---
# API_INST_ERROR_HANDLING_BU

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_INST_ERROR_HANDLING|API_INST_ERROR_HANDLING]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
 l_user VARCHAR2(30);
BEGIN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into l_user from dual ;
  if nvl(:old.machine_id, '*') != nvl(:new.machine_id, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'machine_id',
     :old.machine_id,
     :new.machine_id);
   end;
  end if;

  if nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'chapter_id',
     :old.chapter_id,
     :new.chapter_id);
   end;
  end if;

  if nvl(:old.MACHINE_TEST_ID, '*') != nvl(:new.MACHINE_TEST_ID, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'MACHINE_TEST_ID',
     :old.MACHINE_TEST_ID,
     :new.MACHINE_TEST_ID);
   end;
  end if;
  if nvl(:old.error_code, '*') != nvl(:new.error_code, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'error_code',
     :old.error_code,
     :new.error_code);
   end;
  end if;
  if nvl(:old.error_desc, '*') != nvl(:new.error_desc, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'error_desc',
     :old.error_desc,
     :new.error_desc);
   end;
  end if;

  if nvl(:old.skip_level, '*') != nvl(:new.skip_level, '*') then
  begin
    insert into api_inst_error_handling_audit(
    audit_key,
    audit_insert_dats,
    program_id,
    user_id,
    action_code,
    column_name,
    old_value,
    new_value
    )
   values(
     :old.audit_key,
     sysdate,
     :new.program_id,
     l_user,
     'U',
     'skip_level',
     :old.skip_level,
     :new.skip_level);
   end;
  end if;

 if nvl(:old.eff_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.eff_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
			audit_key ,
			audit_insert_dats ,
			program_id ,
			user_id  ,
			action_code ,
			column_name ,
			old_value ,
			new_value)
		values (
			:old.audit_key ,
			sysdate ,
			:new.program_id ,
			l_user,
			'U',
			'eff_date' ,
			to_char(:old.eff_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.eff_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;

 if nvl(:old.term_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.term_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
			audit_key ,
			audit_insert_dats ,
			program_id ,
			user_id  ,
			action_code ,
			column_name ,
			old_value ,
			new_value)
		values (
			:old.audit_key ,
			sysdate ,
			:new.program_id ,
			l_user,
			'U',
			'term_date' ,
			to_char(:old.term_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.term_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;

 if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
	 begin
	    insert into api_inst_error_handling_audit (
			audit_key ,
			audit_insert_dats ,
			program_id ,
			user_id  ,
			action_code ,
			column_name ,
			old_value ,
			new_value)
		values (
			:old.audit_key ,
			sysdate ,
			:new.program_id ,
			l_user,
			'U',
			'insert_date' ,
			to_char(:old.insert_date ,'MM-DD-YYYY HH24:MI'),
			to_char(:new.insert_date ,'MM-DD-YYYY HH24:MI') );
	 end;
  end if;
      if nvl(:old.insert_user,'*') !=
	 nvl(:new.insert_user,'*')
      then
	 begin
	    insert into api_inst_error_handling_audit (
			audit_key ,
			audit_insert_dats ,
			program_id ,
			user_id  ,
			action_code ,
			column_name ,
			old_value ,
			new_value)
		values (
			:old.audit_key ,
			sysdate ,
			:new.program_id ,
			l_user,
			'U',
			'insert_user' ,
			:old.insert_user ,
			:new.insert_user  );
	 end;
 end if;
---
end;
```
