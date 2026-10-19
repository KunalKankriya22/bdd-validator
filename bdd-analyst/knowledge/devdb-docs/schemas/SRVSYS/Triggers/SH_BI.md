---
tags:
  - trigger
  - SRVSYS
---
# SH_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHIPMENTS|SHIPMENTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
  temp_audit_key  number(23);
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
  /* currently not auditting shipments table
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
   from dual;
  :new.audit_key := temp_audit_key;
  insert into shipments_audit
  (
   shipment_no,
   chapter_id,
   consignee_id,
   shipment_date,
   receipt_date,
   shipment_status,
   shipped_by_user_id,
   shipment_type,
   received_by,
   temperature,
   carrier,
   note_id,
   track_no,
   flight_no,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.shipment_no,
    :new.chapter_id,
    :new.consignee_id,
    :new.shipment_date,
    :new.receipt_date,
    :new.shipment_status,
    :new.shipped_by_user_id,
    :new.shipment_type,
    :new.received_by,
    :new.temperature,
    :new.carrier,
    :new.note_id,
    :new.track_no,
    :new.flight_no,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
      substr(lt_user_session.get_userid,1,6))
  );
  */
end;
```
