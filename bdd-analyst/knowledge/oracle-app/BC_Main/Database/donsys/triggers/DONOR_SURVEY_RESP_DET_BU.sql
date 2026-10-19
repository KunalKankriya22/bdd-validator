--------------------------------------------------------
--  DDL for Trigger DONOR_SURVEY_RESP_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_SURVEY_RESP_DET_BU" 
before update
on DONOR_SURVEY_RESP_DET
for each row
begin
	--

	if nvl(:old.SURVEY_ID,'*') !=
	   nvl(:new.SURVEY_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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

	if nvl(:old.QUESTION_CODE,'*') !=
	   nvl(:new.QUESTION_CODE,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					'QUESTION_CODE' ,
					:old.QUESTION_CODE ,
					:new.QUESTION_CODE);
		end;
	end if;

	if nvl(:old.ANSWER_CODE,'*') !=
	   nvl(:new.ANSWER_CODE,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					'ANSWER_CODE' ,
					:old.ANSWER_CODE ,
					:new.ANSWER_CODE);
		end;
	end if;

	if nvl(:old.ANSWER_COMMENTS,'*') !=
	   nvl(:new.ANSWER_COMMENTS,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					'ANSWER_COMMENTS' ,
					:old.ANSWER_COMMENTS ,
					:new.ANSWER_COMMENTS);
		end;
	end if;

	if nvl(:old.RESPONSE_TYPE,'*') !=
	   nvl(:new.RESPONSE_TYPE,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					'RESPONSE_TYPE' ,
					:old.RESPONSE_TYPE ,
					:new.RESPONSE_TYPE);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
				insert into DONOR_SURVEY_RESP_DET_ADT (
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

	if nvl(:old.RANK_CODE,'*') !=
	   nvl(:new.RANK_CODE,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					'RANK_CODE' ,
					:old.RANK_CODE ,
					:new.RANK_CODE);
		end;
	end if;


	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into DONOR_SURVEY_RESP_DET_ADT (
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
					:new.CHAPTER_ID);
		end;
	end if;

--
end;
/
ALTER TRIGGER "DONSYS"."DONOR_SURVEY_RESP_DET_BU" ENABLE;
