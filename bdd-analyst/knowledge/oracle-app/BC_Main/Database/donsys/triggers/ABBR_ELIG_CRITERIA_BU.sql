--------------------------------------------------------
--  DDL for Trigger ABBR_ELIG_CRITERIA_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."ABBR_ELIG_CRITERIA_BU" 
before update
on abbr_elig_criteria
for each row
begin

	if nvl(:old.FREQ_BETWEEN_DONATIONS,-1) !=
	   nvl(:new.FREQ_BETWEEN_DONATIONS,-1)
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'FREQ_BETWEEN_DONATIONS' ,
					:old.FREQ_BETWEEN_DONATIONS ,
					:new.FREQ_BETWEEN_DONATIONS  );
		end;
	end if;

	if nvl(:old.FREQ_TYPE,'*') !=
	   nvl(:new.FREQ_TYPE,'*')
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'FREQ_TYPE' ,
					:old.FREQ_TYPE ,
					:new.FREQ_TYPE  );
		end;
	end if;

	if nvl(:old.NO_OF_DONATIONS,-1) !=
	   nvl(:new.NO_OF_DONATIONS,-1)
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'NO_OF_DONATIONS' ,
					:old.NO_OF_DONATIONS ,
					:new.NO_OF_DONATIONS  );
		end;
	end if;


	if nvl(:old.INTER_WRONG_QUESTION,'*') !=
	   nvl(:new.INTER_WRONG_QUESTION,'*')
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'INTER_WRONG_QUESTION' ,
					:old.INTER_WRONG_QUESTION ,
					:new.INTER_WRONG_QUESTION  );
		end;
	end if;

	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
				insert into abbr_elig_criteria_AUDIT (
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
				insert into abbr_elig_criteria_AUDIT (
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
				insert into abbr_elig_criteria_AUDIT (
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


	if nvl(:old.DHQ_DON_TYPES,'*') !=
	   nvl(:new.DHQ_DON_TYPES,'*')
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'DHQ_DON_TYPES' ,
					:old.DHQ_DON_TYPES ,
					:new.DHQ_DON_TYPES  );
		end;
	end if;

	if nvl(:old.DEFERRAL_PERIOD,-1) !=
	   nvl(:new.DEFERRAL_PERIOD,-1)
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'DEFERRAL_PERIOD' ,
					:old.DEFERRAL_PERIOD ,
					:new.DEFERRAL_PERIOD  );
		end;
	end if;

	if nvl(:old.MIN_DONATIONS,-1) !=
	   nvl(:new.MIN_DONATIONS,-1)
	then
		begin
				insert into abbr_elig_criteria_AUDIT (
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
					'DEFERRAL_PERIOD' ,
					:old.MIN_DONATIONS ,
					:new.MIN_DONATIONS  );
		end;
	end if;
	--
end;
/
ALTER TRIGGER "DONSYS"."ABBR_ELIG_CRITERIA_BU" ENABLE;
