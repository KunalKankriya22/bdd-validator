---
tags:
  - trigger
  - DONSYS
---
# DONATION_INTERDICTIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_INTERDICTIONS|DONATION_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
if :new.insert_user is null then
     Select lt_user_session.get_userid into :new.insert_user
       from dual ;
end if;
if :new.insert_date is null then
    declare
	  	chp_id VARCHAR2(4);
	    chp_sysdate DATE;
		tz_active VARCHAR2(1);
	begin
	    select nvl(time_zone_enabled, 'N')
       	  into tz_active
       	  from lt_application_config;
	    select chapter_id into chp_id
	      from system_users
	     where user_id = LT_USER_SESSION.get_userid
	      and trunc(sysdate) between eff_date and nvl(term_date,sysdate+365);
		if chp_id is not null then
		   if nvl(tz_active,'N') = 'Y' then
	   	   	  Lifetrack_timezone_convert.get_local_time(chp_id, sysdate, chp_sysdate);
	   	   else
	       	  chp_sysdate := sysdate;
	   	   end if;
		else
		   chp_sysdate := sysdate;
		end if;
		:new.insert_date := chp_sysdate ;
	 exception
	 	when no_data_found then
		   :new.insert_date := sysdate;
		when others then
		   :new.insert_date := sysdate;
	 end;
end if;
if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
end if;

-- get the unit ID: added by edwin 05/05/13

If :new.unit_id is null then
  begin
   select unit_id into :new.unit_id from donations where
   transaction_id=:new.transaction_id;
  exception when others then
    null;
  end;
End if;
end ;



```
