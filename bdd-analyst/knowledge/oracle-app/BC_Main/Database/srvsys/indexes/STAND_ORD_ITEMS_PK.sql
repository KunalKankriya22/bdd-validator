--------------------------------------------------------
--  DDL for Index STAND_ORD_ITEMS_PK
--------------------------------------------------------

  CREATE UNIQUE INDEX "STAND_ORD_ITEMS_PK" ON "STANDING_ORDER_ITEMS" ("CONTRACT_ID", "CHAPTER_ID", "CONSIGNEE_ID", "WEEK_DAY", "ITEM_NO", "PRODUCT_TYPE", "BLOOD_TYPE", "TIER") 
  ;
