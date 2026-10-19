---
tags:
  - trigger
  - DONSYS
---
# DONATION_ATTRIBUTES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_ATTRIBUTES|DONATION_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   l_unit_id	 VARCHAR2(15);
   l_coll_date	 DATE;
BEGIN
   l_unit_id := null;
   l_coll_date := null;
	--
   if nvl(:old.transaction_id,'*') !=
      nvl(:new.transaction_id,'*')
   then
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
		     :new.program_id ,
		     substr(lt_user_session.get_userid,1,6) ,
		     'U',
		     'transaction_id' ,
		     :old.transaction_id ,
		     :new.transaction_id  );
      end;
   end if;
      if nvl(:old.chapter_id,'*') !=
	 nvl(:new.chapter_id,'*')
      then
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
			:new.program_id ,
			substr(lt_user_session.get_userid,1,6) ,
			'U',
			'chapter_id' ,
			:old.chapter_id ,
			:new.chapter_id  );
	 end;
      end if;
      if nvl(:old.attrib_code,'*') !=
	 nvl(:new.attrib_code,'*')
      then
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
			:new.program_id ,
			substr(lt_user_session.get_userid,1,6) ,
			'U',
			'attrib_code' ,
			:old.attrib_code ,
			:new.attrib_code  );
	 end;
      end if;
      if nvl(:old.attrib_value,'*') !=
	 nvl(:new.attrib_value,'*')
      then
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
			:new.program_id ,
			substr(lt_user_session.get_userid,1,6) ,
			'U',
			'attrib_value' ,
			:old.attrib_value ,
			:new.attrib_value  );
	 end;
      end if;
      if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	 nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
      then
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
			:new.program_id ,
			substr(lt_user_session.get_userid,1,6) ,
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
			:new.program_id ,
			substr(lt_user_session.get_userid,1,6) ,
			'U',
			'insert_user' ,
			:old.insert_user ,
			:new.insert_user  );
	 end;
      end if;
---
end;
```
