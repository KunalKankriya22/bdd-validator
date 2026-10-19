--------------------------------------------------------
--  DDL for Trigger DONOR_COMMUNICATIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_COMMUNICATIONS_BU" 
before Update
on DONSYS.DONOR_COMMUNICATIONS
for each row
begin

	if nvl(:old.donor_id,'*') !=
	   nvl(:new.donor_id,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
	if nvl(:old.COM_CODE,'*') !=
	   nvl(:new.COM_CODE,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'COM_CODE' ,
					:old.COM_CODE ,
					:new.COM_CODE  );
		end;
	end if;
	if nvl(:old.COM_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.COM_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'COM_DATE' ,
					:old.COM_DATE ,
					:new.COM_DATE  );
		end;
	end if;
	if nvl(:old.COM_TYPE,'*') !=
	   nvl(:new.COM_TYPE,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'COM_TYPE' ,
					:old.COM_TYPE ,
					:new.COM_TYPE	);
		end;
	end if;
	if nvl(:old.COM_DESC,'*') !=
	   nvl(:new.COM_DESC,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'COM_DESC' ,
					:old.COM_DESC ,
					:new.COM_DESC  );
		end;
	end if;
	if nvl(:old.ACTION_CODE,'*') !=
	   nvl(:new.ACTION_CODE,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'ACTION_CODE' ,
					:old.ACTION_CODE ,
					:new.ACTION_CODE  );
		end;
	end if;
	if nvl(:old.TARGET_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.TARGET_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'TARGET_DATE' ,
					:old.TARGET_DATE ,
					:new.TARGET_DATE  );
		end;
	end if;
	if nvl(:old.ACTION_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.ACTION_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'ACTION_DATE' ,
					:old.ACTION_DATE ,
					:new.ACTION_DATE  );
		end;
	end if;
	if nvl(:old.REQUEST_CODE,'*') !=
	   nvl(:new.REQUEST_CODE,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'REQUEST_CODE' ,
					:old.REQUEST_CODE ,
					:new.REQUEST_CODE  );
		end;
	end if;
	if nvl(:old.LETTER_ID,'*') !=
	   nvl(:new.LETTER_ID,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'LETTER_ID' ,
					:old.LETTER_ID ,
					:new.LETTER_ID  );
		end;
	end if;
	if nvl(:old.STAFF_NO,'*') !=
	   nvl(:new.STAFF_NO,'*')
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
					'STAFF_NO' ,
					:old.STAFF_NO ,
					:new.STAFF_NO  );
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
				insert into DONOR_COMMUNICATIONS_AUDIT (
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
ALTER TRIGGER "DONSYS"."DONOR_COMMUNICATIONS_BU" ENABLE;
