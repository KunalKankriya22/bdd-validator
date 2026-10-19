--------------------------------------------------------
--  DDL for Trigger PICK_SLIP_PRODUCTS_BEF_INS
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PICK_SLIP_PRODUCTS_BEF_INS" 
before insert
on pick_slip_products
for each row
declare
  temp_order_no   char(14);
begin
	if (:new.ord_product_type is not null or
    	:new.ord_blood_type is not null)
	then
	   select ps.order_no
	   into temp_order_no
	   from
	   pick_slips ps
	   where
	   ps.pick_slip_id = :new.pick_slip_id and
	   ps.chapter_id = :new.chapter_id;
	   update order_items
	   set sub_qty = nvl(sub_qty,0) + 1,
			 program_id = :new.program_id
	   where order_no = temp_order_no and
			 item_no = :new.item_no and
			 chapter_id = :new.chapter_id ;
	end if;
end;
/
ALTER TRIGGER "PICK_SLIP_PRODUCTS_BEF_INS" ENABLE;
