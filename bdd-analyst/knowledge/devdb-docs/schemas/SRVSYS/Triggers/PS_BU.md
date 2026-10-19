---
tags:
  - trigger
  - SRVSYS
---
# PS_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/PICK_SLIPS|PICK_SLIPS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
  chp_sysdate date;
begin
   :new.program_id := nvl(:new.program_id,'MANUAL-US');
   if nvl(:old.pick_slip_status,'*') !=
      nvl(:new.pick_slip_status,'*')
   then
      if :old.pick_slip_status = 'AL'
      and :new.pick_slip_status != 'CL'
      then

  	if Lifetrack_timezone_convert.is_timezone_enabled then
	     Lifetrack_timezone_convert.get_local_time(:new.chapter_id,sysdate,chp_sysdate);
		else
	     chp_sysdate := sysdate;
		end if;

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
      :new.pick_slip_status,
      sysdate,
      decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),substr(lt_user_session.get_userid,1,6)),
          :new.pick_slip_id,
      :new.program_id
   );
      end if;
   end if;
end;
```
