---
tags:
  - trigger
  - DONSYS
---
# DRIVES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVES|DRIVES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    if updating ('DRIVE_SHEET_DATE') then
       null ;
    else
    	select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid) into :new.last_modified_user  from dual ;
       :new.last_modified_date := sysdate ;
    end if ;
	--
	if nvl(:old.drive_id,'*') !=
	   nvl(:new.drive_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_id' ,
					:old.drive_id ,
					:new.drive_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
	if nvl(:old.drive_date,to_date('01-JAN-33')) !=
	   nvl(:new.drive_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_date' ,
					:old.drive_date ,
					:new.drive_date  );
		end;
	end if;
	if nvl(:old.drive_type,'*') !=
	   nvl(:new.drive_type,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_type' ,
					:old.drive_type ,
					:new.drive_type  );
		end;
	end if;
	if nvl(:old.schedule_start_time,to_date('01-JAN-33')) !=
	   nvl(:new.schedule_start_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'schedule_start_time' ,
					:old.schedule_start_time ,
					:new.schedule_start_time  );
		end;
	end if;
	if nvl(:old.schedule_end_time,to_date('01-JAN-33')) !=
	   nvl(:new.schedule_end_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'schedule_end_time' ,
					:old.schedule_end_time ,
					:new.schedule_end_time	);
		end;
	end if;
	if nvl(:old.recruiter_id,'*') !=
	   nvl(:new.recruiter_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'recruiter_id' ,
					:old.recruiter_id ,
					:new.recruiter_id  );
		end;
	end if;
	if nvl(:old.location_id,'*') !=
	   nvl(:new.location_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'location_id' ,
					:old.location_id ,
					:new.location_id  );
		end;
	end if;
	if nvl(:old.status,'*') !=
	   nvl(:new.status,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'status' ,
					:old.status ,
					:new.status  );
		end;
	end if;
	if nvl(:old.campaign_id,'*') !=
	   nvl(:new.campaign_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'campaign_id' ,
					:old.campaign_id ,
					:new.campaign_id  );
		end;
	end if;
	if nvl(:old.event_id,'*') !=
	   nvl(:new.event_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'event_id' ,
					:old.event_id ,
					:new.event_id  );
		end;
	end if;
	if nvl(:old.cancel_date,to_date('01-JAN-33')) !=
	   nvl(:new.cancel_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'cancel_date' ,
					:old.cancel_date ,
					:new.cancel_date  );
		end;
	end if;
	if nvl(:old.cancel_user,'*') !=
	   nvl(:new.cancel_user,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'cancel_user' ,
					:old.cancel_user ,
					:new.cancel_user  );
		end;
	end if;
	if nvl(:old.cancel_reason,'*') !=
	   nvl(:new.cancel_reason,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'cancel_reason' ,
					:old.cancel_reason ,
					:new.cancel_reason  );
		end;
	end if;
	if nvl(:old.schedule_id,'*') !=
	   nvl(:new.schedule_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'schedule_id' ,
					:old.schedule_id ,
					:new.schedule_id  );
		end;
	end if;
	if nvl(:old.estimated_cpu,-1) !=
	   nvl(:new.estimated_cpu,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'estimated_cpu' ,
					:old.estimated_cpu ,
					:new.estimated_cpu  );
		end;
	end if;
	if nvl(:old.projected_draw,-1) !=
	   nvl(:new.projected_draw,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'projected_draw' ,
					:old.projected_draw ,
					:new.projected_draw  );
		end;
	end if;
	if nvl(:old.projected_show,-1) !=
	   nvl(:new.projected_show,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'projected_show' ,
					:old.projected_show ,
					:new.projected_show  );
		end;
	end if;
	if nvl(:old.actual_start_time,to_date('01-JAN-33')) !=
	   nvl(:new.actual_start_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_start_time' ,
					:old.actual_start_time ,
					:new.actual_start_time	);
		end;
	end if;
	if nvl(:old.actual_end_time,to_date('01-JAN-33')) !=
	   nvl(:new.actual_end_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_end_time' ,
					:old.actual_end_time ,
					:new.actual_end_time  );
		end;
	end if;
	if nvl(:old.actual_leave_time,to_date('01-JAN-33')) !=
	   nvl(:new.actual_leave_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_leave_time' ,
					:old.actual_leave_time ,
					:new.actual_leave_time	);
		end;
	end if;
	if nvl(:old.actual_return_time,to_date('01-JAN-33')) !=
	   nvl(:new.actual_return_time,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_return_time' ,
					:old.actual_return_time ,
					:new.actual_return_time  );
		end;
	end if;
	if nvl(:old.actual_travel_time,-1) !=
	   nvl(:new.actual_travel_time,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_travel_time' ,
					:old.actual_travel_time ,
					:new.actual_travel_time  );
		end;
	end if;
	if nvl(:old.actual_cpu,-1) !=
	   nvl(:new.actual_cpu,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_cpu' ,
					:old.actual_cpu ,
					:new.actual_cpu  );
		end;
	end if;
	if nvl(:old.actual_stup_bkdown_time,-1) !=
	   nvl(:new.actual_stup_bkdown_time,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'actual_stup_bkdown_time' ,
					:old.actual_stup_bkdown_time ,
					:new.actual_stup_bkdown_time  );
		end;
	end if;
	if nvl(:old.note_id,'*') !=
	   nvl(:new.note_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'note_id' ,
					:old.note_id ,
					:new.note_id  );
		end;
	end if;
	if nvl(:old.open_drive_ind,'*') !=
	   nvl(:new.open_drive_ind,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'open_drive_ind' ,
					:old.open_drive_ind ,
					:new.open_drive_ind  );
		end;
	end if;
	if nvl(:old.drive_category,'*') !=
	   nvl(:new.drive_category,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_category' ,
					:old.drive_category ,
					:new.drive_category  );
		end;
	end if;
	if nvl(:old.territory_id,'*') !=
	   nvl(:new.territory_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'territory_id' ,
					:old.territory_id ,
					:new.territory_id  );
		end;
	end if;
	if nvl(:old.schedule_stup_bkdown_time,-1) !=
	   nvl(:new.schedule_stup_bkdown_time,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'schedule_stup_bkdown_time' ,
					:old.schedule_stup_bkdown_time ,
					:new.schedule_stup_bkdown_time	);
		end;
	end if;
	if nvl(:old.cancel_reason_code,'*') !=
	   nvl(:new.cancel_reason_code,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'cancel_reason_code' ,
					:old.cancel_reason_code ,
					:new.cancel_reason_code  );
		end;
	end if;
	if nvl(:old.hold_reason_code,'*') !=
	   nvl(:new.hold_reason_code,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'hold_reason_code' ,
					:old.hold_reason_code ,
					:new.hold_reason_code  );
		end;
	end if;
	if nvl(:old.rollover_status,'*') !=
	   nvl(:new.rollover_status,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'rollover_status' ,
					:old.rollover_status ,
					:new.rollover_status  );
		end;
	end if;
	if nvl(:old.drive_sheet_date,to_date('01-JAN-33')) !=
	   nvl(:new.drive_sheet_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_sheet_date' ,
					:old.drive_sheet_date ,
					:new.drive_sheet_date  );
		end;
	end if;
	if nvl(:old.min_skill_rating,-1) !=
	   nvl(:new.min_skill_rating,-1)
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'min_skill_rating' ,
					:old.min_skill_rating ,
					:new.min_skill_rating  );
		end;
	end if;
	if nvl(:old.schedule_remarks,'*') !=
	   nvl(:new.schedule_remarks,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'schedule_remarks' ,
					:old.schedule_remarks ,
					:new.schedule_remarks  );
		end;
	end if;
	if nvl(:old.os_ok_flag,'*') !=
	   nvl(:new.os_ok_flag,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'os_ok_flag' ,
					:old.os_ok_flag ,
					:new.os_ok_flag  );
		end;
	end if;
	if nvl(:old.conv_drive_id,'*') !=
	   nvl(:new.conv_drive_id,'*')
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'conv_drive_id' ,
					:old.conv_drive_id ,
					:new.conv_drive_id  );
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
				insert into DRIVES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
```
