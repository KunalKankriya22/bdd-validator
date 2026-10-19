--------------------------------------------------------
--  DDL for Trigger AP_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "AP_BI" before insert on active_products for each row
declare
  temp_audit_key    number(23);
begin
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into product_history
    (
     UNIT_ID,
     COLL_DATE,
     CHAPTER_ID,
     ALIQUOT,
     PRODUCT_CODE,
     blood_type,
     STATUS_IND,
     INVENTORY_CLASS,
     LOCATION_ID,
     FROM_DATE,
     USER_ID,
     program_id,
     warehouse_id
    )
    values
    (
     :new.UNIT_ID,
     :new.COLL_DATE,
     :new.CHAPTER_ID,
     :new.ALIQUOT,
     :new.PRODUCT_CODE,
     :new.blood_type,
     :new.STOCK_STATE,
     :new.INVENTORY_CLASS,
     :new.LOCATION_ID,
     sysdate,
     lt_user_session.get_userid,
     :new.program_id,
     :new.warehouse_id
   );
    if nvl(substr(:new.location_id,9),'0000') != '0000'
    then
	srvlib.update_inventory_levels
			(:new.product_type,
			 :new.blood_type,
			 :new.chapter_id,
			 'STANDARD',
			 :new.inventory_class,
			 :new.unit_id,
			 :new.coll_date,
			 'A');
	srvlib.update_trays (:new.location_id,
			     :new.chapter_id,
			     :new.product_type,
			     :new.blood_type,
			     'A');
    end if;
end;
/
ALTER TRIGGER "AP_BI" ENABLE;
