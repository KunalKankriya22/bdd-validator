---
tags:
  - trigger
  - DONSYS
---
# TRANSF_DETAILS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/TRANSF_DETAILS|TRANSF_DETAILS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	--
	if nvl(:old.pat_id,'*') !=
	   nvl(:new.pat_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'pat_id' ,
					:old.pat_id ,
					:new.pat_id  );
		end;
	end if;
	if nvl(:old.surg_id,'*') !=
	   nvl(:new.surg_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'surg_id' ,
					:old.surg_id ,
					:new.surg_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
	if nvl(:old.facility_id,'*') !=
	   nvl(:new.facility_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'facility_id' ,
					:old.facility_id ,
					:new.facility_id  );
		end;
	end if;
	if nvl(:old.phy_id,'*') !=
	   nvl(:new.phy_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'phy_id' ,
					:old.phy_id ,
					:new.phy_id  );
		end;
	end if;
	if nvl(:old.ship_id,'*') !=
	   nvl(:new.ship_id,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'ship_id' ,
					:old.ship_id ,
					:new.ship_id  );
		end;
	end if;
	if nvl(:old.units_required,'*') !=
	   nvl(:new.units_required,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'units_required' ,
					:old.units_required ,
					:new.units_required  );
		end;
	end if;
	if nvl(:old.phy_auth_date,to_date('01-JAN-33')) !=
	   nvl(:new.phy_auth_date,to_date('01-JAN-33'))
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'phy_auth_date' ,
					:old.phy_auth_date ,
					:new.phy_auth_date  );
		end;
	end if;
	if nvl(:old.surg_date,to_date('01-JAN-33')) !=
	   nvl(:new.surg_date,to_date('01-JAN-33'))
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'surg_date' ,
					:old.surg_date ,
					:new.surg_date	);
		end;
	end if;
	if nvl(:old.surg_type,'*') !=
	   nvl(:new.surg_type,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'surg_type' ,
					:old.surg_type ,
					:new.surg_type	);
		end;
	end if;
	if nvl(:old.emergency_flag,'*') !=
	   nvl(:new.emergency_flag,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'emergency_flag' ,
					:old.emergency_flag ,
					:new.emergency_flag  );
		end;
	end if;
	if nvl(:old.closed_date,to_date('01-JAN-33')) !=
	   nvl(:new.closed_date,to_date('01-JAN-33'))
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'closed_date' ,
					:old.closed_date ,
					:new.closed_date  );
		end;
	end if;
	if nvl(:old.closed_user,to_date('01-JAN-33')) !=
	   nvl(:new.closed_user,to_date('01-JAN-33'))
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'closed_user' ,
					:old.closed_user ,
					:new.closed_user  );
		end;
	end if;
	if nvl(:old.comments,'*') !=
	   nvl(:new.comments,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
					'comments' ,
					:old.comments ,
					:new.comments  );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into TRANSF_DETAILS_AUDIT (
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
	--
end;
```
