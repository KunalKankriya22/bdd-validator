---
tags:
  - trigger
  - DONSYS
---
# DONATIONS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
--
begin
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
'drive_id' ,
:old.drive_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'coll_date' ,
:old.coll_date ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'set_id' ,
:old.set_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'credit_count' ,
:old.credit_count ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
'credit_sponsor' ,
:old.credit_sponsor ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'donation_type' ,
:old.donation_type ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_time_l1' ,
to_char(:old.bleed_start_time_l1,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_time_l2' ,
to_char(:old.bleed_start_time_l2,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_time_r1' ,
to_char(:old.bleed_start_time_r1,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_time_r2' ,
to_char(:old.bleed_start_time_r2,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_time_r' ,
to_char(:old.bleed_end_time_r,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_time_l' ,
to_char(:old.bleed_end_time_l,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_phleb_l1' ,
:old.bleed_start_phleb_l1 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_phleb_l2' ,
:old.bleed_start_phleb_l2 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_phleb_r1' ,
:old.bleed_start_phleb_r1 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_start_phleb_r2' ,
:old.bleed_start_phleb_r2 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_phleb_r' ,
:old.bleed_end_phleb_r ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_phleb_l' ,
:old.bleed_end_phleb_l ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'deferral_reason' ,
:old.deferral_reason ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bag_type' ,
:old.bag_type ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'donor_cue' ,
:old.donor_cue ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
'procedure_code' ,
:old.procedure_code ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
'original_donor_id' ,
:old.original_donor_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'lookup_id' ,
:old.lookup_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'screener_id' ,
:old.screener_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'physical_id' ,
:old.physical_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'first_reviewer_id' ,
:old.first_reviewer_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'second_reviewer_id' ,
:old.second_reviewer_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'deferred_thru_date' ,
:old.deferred_thru_date ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'donor_signature_flag' ,
:old.donor_signature_flag ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'n_audit_flag' ,
:old.n_audit_flag ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'n_audit_user' ,
:old.n_audit_user ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'n_audit_date' ,
:old.n_audit_date ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'arm_used' ,
:old.arm_used ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'void_unit_id' ,
:old.void_unit_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'start_data_entry_time' ,
to_char(:old.start_data_entry_time,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'end_data_entry_time' ,
to_char(:old.end_data_entry_time ,'MM-DD-YYYY HH24:MI'),
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'entry_mode' ,
:old.entry_mode ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'deferral_id' ,
:old.deferral_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'material_id' ,
:old.material_id ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_time_l2' ,
to_char(:old.bleed_end_time_l2,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_phleb_l2' ,
:old.bleed_end_phleb_l2 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_time_r2' ,
to_char(:old.bleed_end_time_r2,'MM-DD-YYYY HH24:MI') ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'bleed_end_phleb_r2' ,
:old.bleed_end_phleb_r2 ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'interface_date' ,
to_char(:old.interface_date ,'MM-DD-YYYY HH24:MI'),
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
insert into DONATIONS_AUDIT (
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
begin
insert into DONATIONS_AUDIT (
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
'plt_pre_count' ,
:old.plt_pre_count ,
NULL);
end;
begin
insert into DONATIONS_AUDIT (
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
'plt_post_count' ,
:old.plt_post_count ,
NULL);
end;
--
end;
```
