--------------------------------------------------------
--  DDL for Index CONV_REF_VALUE_UK
--------------------------------------------------------

  CREATE UNIQUE INDEX "CONV_REF_VALUE_UK" ON "IDP_CONV_REF_VALUES" ("SOURCE_ID", "TARGET_ID", "SOURCE_CODE_TYPE", "TARGET_CODE_TYPE", "SOURCE_VALUE", "TARGET_VALUE") 
  ;
