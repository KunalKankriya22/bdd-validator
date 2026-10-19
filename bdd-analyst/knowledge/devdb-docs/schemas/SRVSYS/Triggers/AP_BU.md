---
tags:
  - trigger
  - SRVSYS
---
# AP_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/ACTIVE_PRODUCTS|ACTIVE_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
   :new.program_id := nvl(:new.program_id,'MANUAL-US');

   -- SCR 152147 -- BCW Changes;
    IF (nvl(:new.inventory_class,'XXX') != nvl(:old.inventory_class,'XXX')) THEN
      begin
         -- On Inventory Class Change check if the new class is Auto Directed
         IF :new.inventory_class = 'AD' THEN
            --No need to check new and old class as trigger only fires when
            --class is changing
            LT_SPATTR_HANDLING.ADD_SPATR_INTER(:new.unit_id, :new.coll_date,
                                               :new.chapter_id, :new.product_code);
         ELSIF :old.inventory_class = 'AD' THEN
            LT_SPATTR_HANDLING.DEL_SPATR_INTER(:new.unit_id, :new.coll_date,
                                               :new.chapter_id,:new.product_code,'N');
         END IF;
      exception
         when others then
            null;
      end;
    END IF;

   if nvl(:old.stock_state,'*') !=
      nvl(:new.stock_state,'*')
   or nvl(:old.inventory_class,'*') !=
      nvl(:new.inventory_class,'*')
   or nvl(:old.location_id,'*') !=
      nvl(:new.location_id,'*')
   then
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
     :old.UNIT_ID,
     :old.COLL_DATE,
     :old.CHAPTER_ID,
     :old.ALIQUOT,
     :old.PRODUCT_CODE,
     :new.blood_type,
     :new.STOCK_STATE,
     :new.INVENTORY_CLASS,
     :new.LOCATION_ID,
     sysdate,
     lt_user_session.get_userid,
     :new.program_id,
	 :new.warehouse_id
     );
   end if;
   if :old.inventory_class != :new.inventory_class
      and nvl(substr(:old.location_id,9),'0000') != '0000'
   then
     srvlib.update_inventory_levels
		(:old.product_type,
		 :old.blood_type,
		 :old.chapter_id,
		 'STANDARD',
		 :old.inventory_class,
		 :old.unit_id,
		 :old.coll_date,
		 'D');
     srvlib.update_inventory_levels
		(:new.product_type,
		 :new.blood_type,
		 :new.chapter_id,
		 'STANDARD',
		 :new.inventory_class,
		 :new.unit_id,
		 :new.coll_date,
		 'A');
   end if;
   if	nvl(:old.stock_state,'*')     != nvl(:new.stock_state,'*')
     or nvl(:old.inventory_class,'*') != nvl(:new.inventory_class,'*')
     or nvl(:old.location_id,'*')     != nvl(:new.location_id,'*')
   then
      if  (  (	 :old.stock_state in ('RP','QU')
	     and :new.stock_state = 'AV')
	  or (	 (  :old.stock_state not in ('AV','AL')
		 or :new.stock_state not in ('PK','QU'))
	     and (  :old.inventory_class != :new.inventory_class
		 or :old.location_id  != :new.location_id)))
      and nvl(substr(:old.location_id,9),'0000') != '0000'
      then
	srvlib.update_trays (:new.location_id,
			     :new.chapter_id,
			     :new.product_type,
			     :new.blood_type,
			     'A');
      end if;
      if  (  (	 :old.stock_state in ('AV','AL','TR')
	     and :new.stock_state in ('PK','QU'))
	  or (	 (  :old.stock_state not in ('RP','QU')
		 or :new.stock_state != 'AV')
	     and (  :old.inventory_class != :new.inventory_class
		 or :old.location_id  != :new.location_id)))
      and nvl(substr(:old.location_id,9),'0000') != '0000'
      then
	srvlib.update_trays (:old.location_id,
			     :old.chapter_id,
			     :old.product_type,
			     :old.blood_type,
			     'D');
      end if;
	  /************ For New Location ID *********************/
	  if ((:old.stock_state in ('TR')
		    and :new.stock_state = ('AV')
			))
      and nvl(substr(:old.location_id,9),'0000') != '0000'
      then
	srvlib.update_trays (:old.location_id,
			     :old.chapter_id,
			     :old.product_type,
			     :old.blood_type,
			     'D');
      end if;
	  if (	(  :old.stock_state in ('TR')
			 and :new.stock_state = ('AV')))
      and nvl(substr(:new.location_id,9),'0000') != '0000'
      then
	srvlib.update_trays (:new.location_id,
			     :new.chapter_id,
			     :new.product_type,
			     :new.blood_type,
			     'A');
      end if;
   end if;
end;

```
