--------------------------------------------------------
--  DDL for Trigger ALT_ID_DONOR_GRADE_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."ALT_ID_DONOR_GRADE_BU" 
 BEFORE UPDATE
 ON ALT_ID_DONOR_GRADE
 FOR EACH ROW
BEGIN
--

if nvl(:old.KEY_DATA_GRADE,'*') !=
nvl(:new.KEY_DATA_GRADE,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'KEY_DATA_GRADE' ,
:old.KEY_DATA_GRADE ,
:new.KEY_DATA_GRADE  );
end;
end if;

if nvl(:old.ALTID_MATCH_TYPE,'*') !=
nvl(:new.ALTID_MATCH_TYPE,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'ALTID_MATCH_TYPE' ,
:old.ALTID_MATCH_TYPE ,
:new.ALTID_MATCH_TYPE  );
end;
end if;

if nvl(:old.FINAL_GRADE,'*') !=
nvl(:new.FINAL_GRADE,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'FINAL_GRADE' ,
:old.FINAL_GRADE ,
:new.FINAL_GRADE  );
end;
end if;

if nvl(:old.EFF_DATE,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.EFF_DATE,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'EFF_DATE' ,
:old.EFF_DATE ,
:new.EFF_DATE	);
end;
end if;

if nvl(:old.TERM_DATE,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.TERM_DATE,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'TERM_DATE' ,
:old.TERM_DATE ,
:new.TERM_DATE	);
end;
end if;

if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'insert_date' ,
to_char(:old.insert_date,'MM-DD-YYYY HH24:MI') ,
to_char(:new.insert_date,'MM-DD-YYYY HH24:MI')	);
end;
end if;

if nvl(:old.insert_user,'*') !=
nvl(:new.insert_user,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'insert_user' ,
:old.insert_user ,
:new.insert_user  );
end;
end if;

end;
/
ALTER TRIGGER "DONSYS"."ALT_ID_DONOR_GRADE_BU" ENABLE;
