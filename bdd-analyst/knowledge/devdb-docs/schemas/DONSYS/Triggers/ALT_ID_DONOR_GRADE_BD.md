---
tags:
  - trigger
  - DONSYS
---
# ALT_ID_DONOR_GRADE_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/ALT_ID_DONOR_GRADE|ALT_ID_DONOR_GRADE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
--
begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'KEY_DATA_GRADE' ,
:old.KEY_DATA_GRADE ,
NULL);
end;

begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'ALTID_MATCH_TYPE' ,
:old.ALTID_MATCH_TYPE ,
NULL);
end;

begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'FINAL_GRADE' ,
:old.FINAL_GRADE ,
NULL);
end;

begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'EFF_DATE' ,
:old.EFF_DATE ,
NULL);
end;

begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'TERM_DATE' ,
:old.TERM_DATE ,
NULL);
end;


begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'insert_date' ,
to_char(:old.insert_date ,'MM-DD-YYYY HH24:MI'),
NULL);
end;

begin
insert into ALT_ID_DONOR_GRADE_AUDIT (
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
substr(lt_user_session.get_userid,1,6) ,
'D',
'insert_user' ,
:old.insert_user ,
NULL);
end;

end;
```
