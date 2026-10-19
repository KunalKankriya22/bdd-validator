---
tags:
  - trigger
  - DONSYS
---
# DONOR_INTERDICTIONS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS|DONOR_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
--
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'donor_id' ,
:old.donor_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'chapter_id' ,
:old.chapter_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'inter_code' ,
:old.inter_code ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'eff_date' ,
:old.eff_date ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'inter_type' ,
:old.inter_type ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'transaction_id' ,
:old.transaction_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'notification_status' ,
:old.notification_status ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'note_id' ,
:old.note_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'release_user' ,
:old.release_user ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'release_date' ,
to_char(:old.release_date,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'unit_id' ,
:old.unit_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'upm_disposition' ,
:old.upm_disposition ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'originated_from' ,
:old.originated_from ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'reason_code' ,
:old.reason_code ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'group_id' ,
:old.group_id ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'letter_seq_no' ,
:old.letter_seq_no ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'group_mode' ,
:old.group_mode ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'term_date' ,
:old.term_date ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
'term_reason' ,
:old.term_reason ,
NULL);
end;
begin
insert into DONOR_INTERDICTIONS_AUDIT (
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
insert into DONOR_INTERDICTIONS_AUDIT (
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
--
end;
```
