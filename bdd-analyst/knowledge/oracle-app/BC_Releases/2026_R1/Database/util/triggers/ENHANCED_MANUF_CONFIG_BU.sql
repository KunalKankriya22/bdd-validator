--------------------------------------------------------
--  DDL for Trigger ENHANCED_MANUF_CONFIG_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "ENHANCED_MANUF_CONFIG_BU" 
before update
on ENHANCED_MANUF_CONFIG
for each row
begin
	--
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
	if nvl(:old.PROCESS_START_LOCATION,'*') !=
	   nvl(:new.PROCESS_START_LOCATION,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'PROCESS_START_LOCATION' ,
					:old.PROCESS_START_LOCATION ,
					:new.PROCESS_START_LOCATION  );
		end;
	end if;
	if nvl(:old.PROCESS_CODE,'*') !=
	   nvl(:new.PROCESS_CODE,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'PROCESS_CODE' ,
					:old.PROCESS_CODE ,
					:new.PROCESS_CODE  );
		end;
	end if;
	if nvl(:old.PROCESS_SEQ,-1) !=
	   nvl(:new.PROCESS_SEQ,-1)
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT(
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
					'PROCESS_SEQ' ,
					:old.PROCESS_SEQ ,
					:new.PROCESS_SEQ  );
		end;
	end if;
	if nvl(:old.DATA_TABLE_NAME_1,'*') !=
	   nvl(:new.DATA_TABLE_NAME_1,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'DATA_TABLE_NAME_1' ,
					:old.DATA_TABLE_NAME_1 ,
					:new.DATA_TABLE_NAME_1  );
		end;
	end if;
	if nvl(:old.DATA_SOURCE_1,'*') !=
	   nvl(:new.DATA_SOURCE_1,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'DATA_SOURCE_1' ,
					:old.DATA_SOURCE_1,
					:new.DATA_SOURCE_1  );
		end;
	end if;
	if nvl(:old.OPERATOR_1,'*') !=
	   nvl(:new.OPERATOR_1,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'OPERATOR_1' ,
					:old.OPERATOR_1,
					:new.OPERATOR_1  );
		end;
	end if;
	if nvl(:old.RESPONSE_1,'*') !=
	   nvl(:new.RESPONSE_1,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'RESPONSE_1' ,
					:old.RESPONSE_1,
					:new.RESPONSE_1  );
		end;
	end if;
	if nvl(:old.DATA_TABLE_NAME_2,'*') !=
	   nvl(:new.DATA_TABLE_NAME_2,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'DATA_TABLE_NAME_2' ,
					:old.DATA_TABLE_NAME_2,
					:new.DATA_TABLE_NAME_2  );
		end;
	end if;
	if nvl(:old.DATA_SOURCE_2,'*') !=
	   nvl(:new.DATA_SOURCE_2,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'DATA_SOURCE_2' ,
					:old.DATA_SOURCE_2,
					:new.DATA_SOURCE_2 );
		end;
	end if;
	if nvl(:old.OPERATOR_2,'*') !=
	   nvl(:new.OPERATOR_2,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'OPERATOR_2' ,
					:old.OPERATOR_2,
					:new.OPERATOR_2 );
		end;
	end if;
	if nvl(:old.RESPONSE_2,'*') !=
	   nvl(:new.RESPONSE_2,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'RESPONSE_2' ,
					:old.RESPONSE_2,
					:new.RESPONSE_2 );
		end;
	end if;
	if nvl(:old.TARGET_LOC,'*') !=
	   nvl(:new.TARGET_LOC,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_LOC' ,
					:old.TARGET_LOC,
					:new.TARGET_LOC );
		end;
	end if;
	if nvl(:old.TARGET_ACTION,'*') !=
	   nvl(:new.TARGET_ACTION,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_ACTION' ,
					:old.TARGET_ACTION,
					:new.TARGET_ACTION);
		end;
	end if;
	if nvl(:old.TARGET_ACTION_ON,'*') !=
	   nvl(:new.TARGET_ACTION_ON,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_ACTION_ON' ,
					:old.TARGET_ACTION_ON,
					:new.TARGET_ACTION_ON);
		end;
	end if;
	if nvl(:old.TARGET_ACTION_VALUE,'*') !=
	   nvl(:new.TARGET_ACTION_VALUE,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_ACTION_VALUE' ,
					:old.TARGET_ACTION_VALUE,
					:new.TARGET_ACTION_VALUE);
		end;
	end if;
	if nvl(:old.TARGET_DATA_TABLE,'*') !=
	   nvl(:new.TARGET_DATA_TABLE,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_DATA_TABLE' ,
					:old.TARGET_DATA_TABLE,
					:new.TARGET_DATA_TABLE);
		end;
	end if;
	if nvl(:old.TARGET_DATA_SOURCE,'*') !=
	   nvl(:new.TARGET_DATA_SOURCE,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_DATA_SOURCE' ,
					:old.TARGET_DATA_SOURCE,
					:new.TARGET_DATA_SOURCE);
		end;
	end if;
	if nvl(:old.TARGET_OPERATOR,'*') !=
	   nvl(:new.TARGET_OPERATOR,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_OPERATOR' ,
					:old.TARGET_OPERATOR,
					:new.TARGET_OPERATOR);
		end;
	end if;
	if nvl(:old.TARGET_RESPONSE,'*') !=
	   nvl(:new.TARGET_RESPONSE,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'TARGET_RESPONSE' ,
					:old.TARGET_RESPONSE,
					:new.TARGET_RESPONSE);
		end;
	end if;
	if nvl(:old.ACTION_FUNCTIONS,'*') !=
	   nvl(:new.ACTION_FUNCTIONS,'*')
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
					'ACTION_FUNCTIONS' ,
					:old.ACTION_FUNCTIONS,
					:new.ACTION_FUNCTIONS);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
				insert into ENHANCED_MANUF_CONFIG_AUDIT (
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
ALTER TRIGGER "ENHANCED_MANUF_CONFIG_BU" ENABLE;
