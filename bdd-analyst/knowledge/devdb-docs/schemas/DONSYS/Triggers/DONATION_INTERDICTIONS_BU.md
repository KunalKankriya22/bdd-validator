---
tags:
  - trigger
  - DONSYS
---
# DONATION_INTERDICTIONS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_INTERDICTIONS|DONATION_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.TRANSACTION_ID,'*') !=
	   nvl(:new.TRANSACTION_ID,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT(
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
					'TRANSACTION_ID' ,
					:old.TRANSACTION_ID ,
					:new.TRANSACTION_ID);
		end;
	end if;


	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'CHAPTER_ID' ,
					:old.CHAPTER_ID,
					:new.CHAPTER_ID);
		end;
	end if;


	if nvl(:old.INTER_CODE,'*') !=
	   nvl(:new.INTER_CODE,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'INTER_CODE' ,
					:old.INTER_CODE,
					:new.INTER_CODE);
		end;
	end if;


	if nvl(:old.INTER_TYPE,'*') !=
	   nvl(:new.INTER_TYPE,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'INTER_TYPE' ,
					:old.INTER_TYPE,
					:new.INTER_TYPE);
		end;
	end if;

	if nvl(:old.SOURCE_CODE,'*') !=
	   nvl(:new.SOURCE_CODE,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'SOURCE_CODE' ,
					:old.SOURCE_CODE,
					:new.SOURCE_CODE);
		end;
	end if;


	if nvl(:old.RELEASE_USER,'*') !=
	   nvl(:new.RELEASE_USER,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'RELEASE_USER' ,
					:old.RELEASE_USER,
					:new.RELEASE_USER);
		end;
	end if;

	if nvl(:old.RELEASE_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.RELEASE_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'RELEASE_DATE' ,
					:old.RELEASE_DATE ,
					:new.RELEASE_DATE  );
		end;
	end if;

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'UNIT_ID' ,
					:old.UNIT_ID,
					:new.UNIT_ID);
		end;
	end if;

	if nvl(:old.TERM_REASON,'*') !=
	   nvl(:new.TERM_REASON,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'TERM_REASON' ,
					:old.TERM_REASON,
					:new.TERM_REASON);
		end;
	end if;


	if nvl(:old.TERM_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.TERM_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					:new.TERM_DATE  );
		end;
	end if;

	if nvl(:old.GROUP_ID,'*') !=
	   nvl(:new.GROUP_ID,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'GROUP_ID' ,
					:old.GROUP_ID,
					:new.GROUP_ID);
		end;
	end if;

	if nvl(:old.ORIGINATED_FROM,'*') !=
	   nvl(:new.ORIGINATED_FROM,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'ORIGINATED_FROM' ,
					:old.ORIGINATED_FROM,
					:new.ORIGINATED_FROM);
		end;
	end if;

	if nvl(:old.REASON_CODE,'*') !=
	   nvl(:new.REASON_CODE,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'REASON_CODE' ,
					:old.REASON_CODE,
					:new.REASON_CODE);
		end;
	end if;

	if nvl(:old.GROUP_MODE,'*') !=
	   nvl(:new.GROUP_MODE,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'GROUP_MODE' ,
					:old.GROUP_MODE,
					:new.GROUP_MODE);
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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

	if nvl(:old.COLL_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.COLL_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'COLL_DATE' ,
					:old.COLL_DATE ,
					:new.COLL_DATE  );
		end;
	end if;


	if nvl(:old.COMMENTS,'*') !=
	   nvl(:new.COMMENTS,'*')
	then
		begin
				insert into DONATION_INTERDICTIONS_ADT (
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
					'COMMENTS' ,
					:old.COMMENTS,
					:new.COMMENTS);
		end;
	end if;

end;
```
