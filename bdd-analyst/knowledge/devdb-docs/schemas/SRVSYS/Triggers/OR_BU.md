---
tags:
  - trigger
  - SRVSYS
---
# OR_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/ORDERS|ORDERS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
  chp_sysdate         date;
begin
  -- Added by Kishore on 04/27/2012. IM 8510
  if lifetrack_timezone_convert.is_timezone_enabled then
    lifetrack_timezone_convert.get_local_time(:new.chapter_id, sysdate, chp_sysdate);
  else
    chp_sysdate := sysdate;
  end if;
  -- End of change

  if nvl(:old.order_status,'*') !=
     nvl(:new.order_status,'*')
  then
     if :new.order_status in ('CA', 'SY', 'HO')
     then
	 insert into order_history
	 (
	   ORDER_NO,
   	   CHAPTER_ID,
   	   ORDER_STATUS,
   	   FROM_DATE,
   	   USER_ID,
   	   PICK_SLIP_ID,
	   program_id
	 )
	 values
	 (
   	   :new.ORDER_NO,
   	   :new.CHAPTER_ID,
   	   :new.ORDER_STATUS,
   	   --:new.insert_date, -- Commented by Kishore on 04/27/2012. IM 8510
	   chp_sysdate, -- Added by Kishore on 04/27/2012. IM 8510
	   decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),substr(lt_user_session.get_userid,1,6)),
   	   'TRIGGER',
	   :new.program_id
	 );
     end if;
  end if;
end;
```
