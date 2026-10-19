---
tags:
  - trigger
  - DONSYS
---
# DRIVE_SPONSORS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_SPONSORS|DRIVE_SPONSORS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	--
	if nvl(:old.drive_id,'*') !=
	   nvl(:new.drive_id,'*')
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'drive_id' ,
					:old.drive_id ,
					:new.drive_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
	if nvl(:old.sponsor_id,'*') !=
	   nvl(:new.sponsor_id,'*')
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'sponsor_id' ,
					:old.sponsor_id ,
					:new.sponsor_id  );
		end;
	end if;
	if nvl(:old.projected_show,-1) !=
	   nvl(:new.projected_show,-1)
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'projected_show' ,
					:old.projected_show ,
					:new.projected_show  );
		end;
	end if;
	if nvl(:old.projected_draw,-1) !=
	   nvl(:new.projected_draw,-1)
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'projected_draw' ,
					:old.projected_draw ,
					:new.projected_draw  );
		end;
	end if;
	if nvl(:old.contact_id,'*') !=
	   nvl(:new.contact_id,'*')
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'contact_id' ,
					:old.contact_id ,
					:new.contact_id  );
		end;
	end if;
	if nvl(:old.proj_deferral_rate,-1) !=
	   nvl(:new.proj_deferral_rate,-1)
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'proj_deferral_rate' ,
					:old.proj_deferral_rate ,
					:new.proj_deferral_rate  );
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
	   nvl(:new.insert_date,to_date('01-JAN-1933','DD-MON-YYYY'))
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					to_char(:old.insert_date ,'MM-DD-YYYY HH
24:MI'),
					to_char(:new.insert_date ,'MM-DD-YYYY HH
24:MI') );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
	/*-- If Proj.show/draw got updated, update DRIVES table --*/
	BEGIN
	if nvl(:old.projected_draw,0) != nvl(:new.projected_draw,0) or
	   nvl(:old.projected_show,0) != nvl(:new.projected_show,0) then
	    update drives set
	    projected_draw = nvl(projected_draw,0) - :old.projected_draw + :new.projected_draw,
	    projected_show = nvl(projected_show,0) - :old.projected_show + :new.projected_show
	    where drive_id = :new.drive_id
	    and  chapter_id = :new.chapter_id ;
	end if ;
	END;
end;
```
