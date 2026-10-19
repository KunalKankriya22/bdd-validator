---
tags:
  - trigger
  - SRVSYS
---
# SH_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHIPMENTS|SHIPMENTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
  cursor c1 is
  select distinct order_no from pick_slips ps where exists (select 'x' from
  boxes bx, pick_slip_products psp  where
  bx.shipment_no=:new.shipment_no
  and bx.box_id=psp.box_id
  and ps.pick_slip_id=psp.pick_slip_id
  and psp.chapter_id=:new.chapter_id
  and bx.chapter_id=:new.chapter_id)
  and ps.chapter_id=:new.chapter_id;

  chp_sysdate date;
begin
   if nvl(:old.shipment_status,'*') != nvl(:new.shipment_status,'*') and
     :new.shipment_status in ('SH','DL')
   then
    if Lifetrack_timezone_convert.is_timezone_enabled then
	     Lifetrack_timezone_convert.get_local_time(:new.chapter_id,sysdate,chp_sysdate);
		else
	     chp_sysdate := sysdate;
		end if;
      for c1rec in c1 loop
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
      c1rec.ORDER_NO,
      :new.CHAPTER_ID,
      :new.shipment_status,
      chp_sysdate,
      decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
    substr(lt_user_session.get_userid,1,6)),
      'TRIGGER',
      :new.program_id
   );
      end loop;
   end if;
end;
```
