--------------------------------------------------------
--  DDL for Trigger DP_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DP_BU" before update on discard_products for each row
begin
   if :new.product_status = 'PK'
   then
      insert into product_history
      (
	UNIT_ID,
	COLL_DATE,
	CHAPTER_ID,
	ALIQUOT,
	PRODUCT_CODE,
	STATUS_IND,
	INVENTORY_CLASS,
	FROM_DATE,
	USER_ID,
	program_id
      )
      values
      (
	:new.UNIT_ID,
	:new.COLL_DATE,
	:new.CHAPTER_ID,
	:new.ALIQUOT,
	:new.PRODUCT_CODE,
	:new.product_status,
	'DI',
	sysdate,
	lt_user_session.get_userid,
	:new.program_id
      );
   end if;
    insert into discard_products_audit
    (
      pick_slip_id,
      CHAPTER_ID,
      UNIT_ID,
      COLL_DATE,
      ALIQUOT,
      PRODUCT_CODE,
      BLOOD_TYPE,
      product_price,
      product_status,
      box_id,
      EXP_DATE,
      discard_type,
      LOCATION_ID,
      PRODUCT_TYPE,
      insert_date,
      reject_reason,
      AUDIT_KEY,
      PROGRAM_ID,
      audit_insert_user,
      audit_insert_date
     )
     values
     (
      :new.pick_slip_id,
      :new.CHAPTER_ID,
      :new.UNIT_ID,
      :new.COLL_DATE,
      :new.ALIQUOT,
      :new.PRODUCT_CODE,
      :new.BLOOD_TYPE,
      :new.product_price,
      :new.product_status,
      :new.box_id,
      :new.EXP_DATE,
      :new.discard_type,
      :new.LOCATION_ID,
      :new.PRODUCT_TYPE,
      :new.insert_date,
      :new.reject_reason,
      :new.AUDIT_KEY,
      :new.PROGRAM_ID,
      lt_user_session.get_userid,
      sysdate
     );
end;
/
ALTER TRIGGER "DP_BU" ENABLE;
