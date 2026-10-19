--------------------------------------------------------
--  DDL for Index INVENTORY_LEVELS_UK
--------------------------------------------------------

  CREATE UNIQUE INDEX "INVENTORY_LEVELS_UK" ON "INVENTORY_LEVELS" ("CUSTOMER_ID", "CHAPTER_ID", "INVENTORY_CLASS", "PRODUCT_TYPE", "BLOOD_TYPE", "TIER", "ATTRIB_CODE", "ATTRIB_GROUP") 
  ;
