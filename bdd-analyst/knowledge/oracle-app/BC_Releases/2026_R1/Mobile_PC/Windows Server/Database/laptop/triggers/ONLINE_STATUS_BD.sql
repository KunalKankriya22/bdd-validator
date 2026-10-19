--------------------------------------------------------
--  DDL for Trigger ONLINE_STATUS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "ONLINE_STATUS_BD" 
before delete
on online_status
for each row
begin
	--
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'TRANSACTION_ID' ,
					:old.TRANSACTION_ID ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'LOOKUP_START' ,
					:old.LOOKUP_START ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'LOOKUP_END' ,
					:old.LOOKUP_END ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'LKUP_OVR_RSN' ,
					:old.LKUP_OVR_RSN ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'LKUP_UPDT_BY' ,
					:old.LKUP_UPDT_BY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'LKUP_UPDT_TIME' ,
					:old.LKUP_UPDT_TIME ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'HLTH_HIST_START' ,
					:old.HLTH_HIST_START ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'HLTH_HIST_END' ,
					:old.HLTH_HIST_END ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'HLTH_HIST_OVR_RSN' ,
					:old.HLTH_HIST_OVR_RSN ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'HLTH_UPDT_BY' ,
					:old.HLTH_UPDT_BY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'HLTH_UPDT_TIME' ,
					:old.HLTH_UPDT_TIME ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHY_FINDINGS_START' ,
					:old.PHY_FINDINGS_START ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHY_FINDINGS_END' ,
					:old.PHY_FINDINGS_END ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHY_OVR_RSN' ,
					:old.PHY_OVR_RSN ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHY_UPDT_BY' ,
					:old.PHY_UPDT_BY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHY_UPDT_TIME' ,
					:old.PHY_UPDT_TIME ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHELOB_START' ,
					:old.PHELOB_START ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHELOB_END' ,
					:old.PHELOB_END ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHELOB_UPDT_BY' ,
					:old.PHELOB_UPDT_BY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PHELOB_UPDT_TIME' ,
					:old.PHELOB_UPDT_TIME ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'DONOR_STOPPED_AT' ,
					:old.DONOR_STOPPED_AT ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'STATUS_FLAG' ,
					:old.STATUS_FLAG ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'COMMENTS' ,
					:old.COMMENTS ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'PRINT_DATE' ,
					:old.PRINT_DATE ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'UNIT_STATUS' ,
					:old.UNIT_STATUS ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'UNIT_STATUS_UPDT_BY' ,
					:old.UNIT_STATUS_UPDT_BY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'UNIT_STATUS_UPDT_ON' ,
					:old.UNIT_STATUS_UPDT_ON ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'COMPETENCY_QUES' ,
					:old.COMPETENCY_QUES ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'COMPETENCY_ANS' ,
					:old.COMPETENCY_ANS ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'COMPETENCY_ON' ,
					:old.COMPETENCY_ON ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'DONOR_ID' ,
					:old.DONOR_ID ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'DRIVE_ID' ,
					:old.DRIVE_ID ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'DRIVE_DATE' ,
					:old.DRIVE_DATE ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'IDP_PROC_CODE' ,
					:old.IDP_PROC_CODE ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'IDP_PROC_STATUS' ,
					:old.IDP_PROC_STATUS ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'IDP_PROC_STATUS_DATS' ,
					:old.IDP_PROC_STATUS_DATS ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'DONOR_ID_VERIFIED' ,
					:old.DONOR_ID_VERIFIED ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'AUDIT_KEY' ,
					:old.AUDIT_KEY ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'INSERT_DATE' ,
					:old.INSERT_DATE ,
					NULL);
		end;
		begin
				insert into ONLINE_STATUS_AUDIT (
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
					'INSERT_USER' ,
					:old.INSERT_USER ,
					NULL);
		end;

	--
end;
/
ALTER TRIGGER "ONLINE_STATUS_BD" ENABLE;
