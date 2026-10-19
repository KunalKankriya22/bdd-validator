---
tags:
  - trigger
  - DONSYS
---
# DONATION_ATTRIBUTES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_ATTRIBUTES|DONATION_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
l_unit_id     VARCHAR2(15);
l_coll_date   DATE;
BEGIN
l_unit_id := null;
l_coll_date := null;
--
   begin
      insert into DONATION_ATTRIBUTES_AUDIT (
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
      insert into DONATION_ATTRIBUTES_AUDIT (
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
      insert into DONATION_ATTRIBUTES_AUDIT (
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
		  'attrib_code' ,
		  :old.attrib_code ,
		  NULL);
   end;
   begin
      insert into DONATION_ATTRIBUTES_AUDIT (
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
		  'attrib_value' ,
		  :old.attrib_value ,
		  NULL);
   end;
   begin
      insert into DONATION_ATTRIBUTES_AUDIT (
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
		  to_char(:old.insert_date,'MM-DD-YYYY HH24:MI') ,
		  NULL);
   end;
   begin
      insert into DONATION_ATTRIBUTES_AUDIT (
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
