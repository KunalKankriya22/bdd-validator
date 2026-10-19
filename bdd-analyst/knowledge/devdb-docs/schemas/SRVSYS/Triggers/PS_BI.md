---
tags:
  - trigger
  - SRVSYS
---
# PS_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/PICK_SLIPS|PICK_SLIPS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
  temp_audit_key  number(23);
  chp_sysdate     date;
begin
  if :new.pick_slip_type = 'AL'
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
    chp_sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
      substr(lt_user_session.get_userid,1,6)),
    :new.pick_slip_id,
    :new.program_id
      );
  end if;
end;
```
