--------------------------------------------------------
--  DDL for Trigger DONOR_INTERDICTIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_INTERDICTIONS_BU" 
 BEFORE UPDATE
 ON DONOR_INTERDICTIONS
 FOR EACH ROW
BEGIN
:new.last_modified_date := sysdate;
--
if nvl(:old.donor_id,'*') !=
nvl(:new.donor_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'donor_id' ,
:old.donor_id ,
:new.donor_id  );
end;
end if;
if nvl(:old.chapter_id,'*') !=
nvl(:new.chapter_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'chapter_id' ,
:old.chapter_id ,
:new.chapter_id  );
end;
end if;
if nvl(:old.inter_code,'*') !=
nvl(:new.inter_code,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'inter_code' ,
:old.inter_code ,
:new.inter_code  );
end;
end if;
if nvl(:old.eff_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.eff_date,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'eff_date' ,
:old.eff_date ,
:new.eff_date  );
end;
end if;
if nvl(:old.inter_type,'*') !=
nvl(:new.inter_type,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'inter_type' ,
:old.inter_type ,
:new.inter_type  );
end;
end if;
if nvl(:old.transaction_id,'*') !=
nvl(:new.transaction_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'transaction_id' ,
:old.transaction_id ,
:new.transaction_id  );
end;
end if;
if nvl(:old.notification_status,'*') !=
nvl(:new.notification_status,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'notification_status' ,
:old.notification_status ,
:new.notification_status  );
end;
end if;
if nvl(:old.note_id,'*') !=
nvl(:new.note_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'note_id' ,
:old.note_id ,
:new.note_id  );
end;
end if;
if nvl(:old.release_user,'*') !=
nvl(:new.release_user,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'release_user' ,
:old.release_user ,
:new.release_user  );
end;
end if;
if nvl(:old.release_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.release_date,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'release_date' ,
to_char(:old.release_date,'MM-DD-YYYY HH24:MI' ),
to_char(:new.release_date ,'MM-DD-YYYY HH24:MI') );
end;
end if;
if nvl(:old.unit_id,'*') !=
nvl(:new.unit_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'unit_id' ,
:old.unit_id ,
:new.unit_id  );
end;
end if;
if nvl(:old.upm_disposition,'*') !=
nvl(:new.upm_disposition,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'upm_disposition' ,
:old.upm_disposition ,
:new.upm_disposition  );
end;
end if;
if nvl(:old.originated_from,'*') !=
nvl(:new.originated_from,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'originated_from' ,
:old.originated_from ,
:new.originated_from  );
end;
end if;
if nvl(:old.reason_code,'*') !=
nvl(:new.reason_code,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'reason_code' ,
:old.reason_code ,
:new.reason_code  );
end;
end if;
if nvl(:old.group_id,'*') !=
nvl(:new.group_id,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'group_id' ,
:old.group_id ,
:new.group_id  );
end;
end if;
if nvl(:old.letter_seq_no,'*') !=
nvl(:new.letter_seq_no,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'letter_seq_no' ,
:old.letter_seq_no ,
:new.letter_seq_no  );
end;
end if;
if nvl(:old.group_mode,'*') !=
nvl(:new.group_mode,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'group_mode' ,
:old.group_mode ,
:new.group_mode  );
end;
end if;
if nvl(:old.term_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.term_date,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'term_date' ,
:old.term_date ,
:new.term_date	);
end;
end if;
if nvl(:old.term_reason,'*') !=
nvl(:new.term_reason,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'term_reason' ,
:old.term_reason ,
:new.term_reason  );
end;
end if;
if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'insert_date' ,
:old.insert_date ,
:new.insert_date  );
end;
end if;
if nvl(:old.insert_user,'*') !=
nvl(:new.insert_user,'*')
then
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
:new.program_id ,
substr(lt_user_session.get_userid,1,6) ,
'U',
'insert_user' ,
:old.insert_user ,
:new.insert_user  );
end;
end if;
--
end;
/
ALTER TRIGGER "DONSYS"."DONOR_INTERDICTIONS_BU" ENABLE;
