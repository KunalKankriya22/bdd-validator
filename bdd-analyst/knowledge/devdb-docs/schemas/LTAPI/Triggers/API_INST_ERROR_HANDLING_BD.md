---
tags:
  - trigger
  - LTAPI
---
# API_INST_ERROR_HANDLING_BD

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_INST_ERROR_HANDLING|API_INST_ERROR_HANDLING]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
 l_user VARCHAR2(30);
BEGIN

     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into l_user from dual ;
--

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'machine_id' ,
:old.machine_id ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'chapter_id' ,
:old.chapter_id ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'error_code' ,
:old.error_code ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'error_desc' ,
:old.error_desc ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'skip_level' ,
:old.skip_level ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'eff_date' ,
:old.eff_date,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'term_date' ,
:old.term_date ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'insert_date' ,
:old.insert_date ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'insert_user' ,
:old.insert_user ,
NULL);
end;

begin
insert into API_INST_ERROR_HANDLING_AUDIT (
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
'DELETE' ,
l_user,
'D',
'MACHINE_TEST_ID' ,
:old.MACHINE_TEST_ID ,
NULL);
end;
end;
```
