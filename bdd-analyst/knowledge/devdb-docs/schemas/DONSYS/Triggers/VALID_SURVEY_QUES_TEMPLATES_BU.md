---
tags:
  - trigger
  - DONSYS
---
# VALID_SURVEY_QUES_TEMPLATES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_SURVEY_QUES_TEMPLATES|VALID_SURVEY_QUES_TEMPLATES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.TEMPLATE_ID,'*') !=
	   nvl(:new.TEMPLATE_ID,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT(
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

	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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

	if nvl(:old.QUESTION_CODE,'*') !=
	   nvl(:new.QUESTION_CODE,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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

	if nvl(:old.QUESTION_DESC,'*') !=
	   nvl(:new.QUESTION_DESC,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'QUESTION_DESC' ,
					:old.QUESTION_DESC ,
					:new.QUESTION_DESC);
		end;
	end if;

	if nvl(:old.DISP_QUESTION_CODE,'*') !=
	   nvl(:new.DISP_QUESTION_CODE,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'DISP_QUESTION_CODE' ,
					:old.DISP_QUESTION_CODE ,
					:new.DISP_QUESTION_CODE);
		end;
	end if;

	if nvl(:old.TYPE_OF_SURVEY,'*') !=
	   nvl(:new.TYPE_OF_SURVEY,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'TYPE_OF_SURVEY' ,
					:old.TYPE_OF_SURVEY ,
					:new.TYPE_OF_SURVEY);
		end;
	end if;

	if nvl(:old.GENDER,'*') !=
	   nvl(:new.GENDER,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'GENDER' ,
					:old.GENDER ,
					:new.GENDER);
		end;
	end if;

	if nvl(:old.DISPLAY_ORDER,-1) !=
	   nvl(:new.DISPLAY_ORDER,-1)
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'DISPLAY_ORDER' ,
					:old.DISPLAY_ORDER ,
					:new.DISPLAY_ORDER  );
		end;
	end if;


	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					:new.EFF_DATE  );
		end;
	end if;

	if nvl(:old.TERM_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.TERM_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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

	if nvl(:old.BLOCK_FLAG,'*') !=
	   nvl(:new.BLOCK_FLAG,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'BLOCK_FLAG' ,
					:old.BLOCK_FLAG ,
					:new.BLOCK_FLAG);
		end;
	end if;

	if nvl(:old.SUB_QUESTION_FLAG,'*') !=
	   nvl(:new.SUB_QUESTION_FLAG,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'SUB_QUESTION_FLAG' ,
					:old.SUB_QUESTION_FLAG ,
					:new.SUB_QUESTION_FLAG);
		end;
	end if;

	if nvl(:old.PARENT_QUES_CODE,'*') !=
	   nvl(:new.PARENT_QUES_CODE,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'PARENT_QUES_CODE' ,
					:old.PARENT_QUES_CODE ,
					:new.PARENT_QUES_CODE);
		end;
	end if;

	if nvl(:old.RANDOMIZATION_FLAG,'*') !=
	   nvl(:new.RANDOMIZATION_FLAG,'*')
	then
		begin
				insert into VALID_SURVEY_QUES_TMPLATES_ADT (
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
					'RANDOMIZATION_FLAG' ,
					:old.RANDOMIZATION_FLAG ,
					:new.RANDOMIZATION_FLAG);
		end;
	end if;


--
end;
```
