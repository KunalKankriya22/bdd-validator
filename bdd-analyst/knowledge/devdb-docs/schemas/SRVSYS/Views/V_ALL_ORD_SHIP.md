---
tags:
  - view
  - SRVSYS
---
# V_ALL_ORD_SHIP

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Text Length**: 519 chars

## Referenced Tables

- [[schemas/SRVSYS/Tables/SHIPMENTS|SRVSYS.SHIPMENTS]]

## Definition

```sql
select distinct
       ord.chapter_id chapter_id,
	   ord.order_no order_no,
	   psp.pick_slip_id pick_slip_id,
	   bx.box_id box_id,
	   sh.shipment_no shipment_no
from shipments sh,
	 boxes bx,
	 pick_slip_products psp,
	 pick_slips ps,
	 orders ord
where sh.shipment_no (+) = bx.shipment_no and
	 bx.box_id (+)  = psp.box_id and
	 psp.pick_slip_id (+) = ps.pick_slip_id and
	 ps.order_no (+) = ord.order_no
group by
       ord.chapter_id,
	   ord.order_no ,
	   psp.pick_slip_id ,
	   bx.box_id ,
	   sh.shipment_no

```
