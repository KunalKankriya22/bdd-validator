--------------------------------------------------------
--  DDL for Trigger DONOR_SURVEY_RESP_HDR_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_SURVEY_RESP_HDR_BU" 
before update
on DONOR_SURVEY_RESP_HDR
for each row
begin
	--

	if nvl(:old.SURVEY_ID,'*') !=
	   nvl(:new.SURVEY_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					'SURVEY_ID' ,
					:old.SURVEY_ID ,
					:new.SURVEY_ID);
		end;
	end if;

	if nvl(:old.TEMPLATE_ID,'*') !=
	   nvl(:new.TEMPLATE_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					'TEMPLATE_ID' ,
					:old.TEMPLATE_ID ,
					:new.TEMPLATE_ID);
		end;
	end if;

	if nvl(:old.SURVEY_START,to_date('01-JAN-33')) !=
	   nvl(:new.SURVEY_START,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					'SURVEY_START' ,
					:old.SURVEY_START ,
					:new.SURVEY_START  );
		end;
	end if;


	if nvl(:old.SURVEY_END,to_date('01-JAN-33')) !=
	   nvl(:new.SURVEY_END,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					'SURVEY_END' ,
					:old.SURVEY_END ,
					:new.SURVEY_END  );
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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

	if nvl(:old.DONOR_ID,'*') !=
	   nvl(:new.DONOR_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					'DONOR_ID' ,
					:old.DONOR_ID ,
					:new.DONOR_ID  );
		end;
	end if;

	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_HDR_ADT (
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
					:old.CHAPTER_ID ,
					:new.CHAPTER_ID  );
		end;
	end if;
--
end;
/
ALTER TRIGGER "DONSYS"."DONOR_SURVEY_RESP_HDR_BU" ENABLE;
