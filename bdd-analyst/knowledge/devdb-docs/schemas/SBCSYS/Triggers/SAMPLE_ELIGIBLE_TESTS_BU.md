---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_ELIGIBLE_TESTS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_ELIGIBLE_TESTS|SAMPLE_ELIGIBLE_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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
					:old.UNIT_ID ,
					:new.UNIT_ID  );
		end;
	end if;



	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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

	if nvl(:old.COLL_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.COLL_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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

	if nvl(:old.TEST_ID,'*') !=
	   nvl(:new.TEST_ID,'*')
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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
					'TEST_ID' ,
					:old.TEST_ID ,
					:new.TEST_ID  );
		end;
	end if;




	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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

	if nvl(:old.SAMPLE_TYPE,'*') !=
	   nvl(:new.SAMPLE_TYPE,'*')
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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
					'SAMPLE_TYPE' ,
					:old.SAMPLE_TYPE ,
					:new.SAMPLE_TYPE  );
		end;
	end if;


	if nvl(:old.SAMPLE_SEQ_NO,'*') !=
	   nvl(:new.SAMPLE_SEQ_NO,'*')
	then
		begin
				insert into SAMPLE_ELIGIBLE_TESTS_AUDIT (
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
					'SAMPLE_SEQ_NO' ,
					:old.SAMPLE_SEQ_NO ,
					:new.SAMPLE_SEQ_NO  );
		end;
	end if;

--
end;



```
