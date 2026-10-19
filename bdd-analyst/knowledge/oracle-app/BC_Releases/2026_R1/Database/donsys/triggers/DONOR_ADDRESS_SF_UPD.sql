--------------------------------------------------------
--  DDL for Trigger DONOR_ADDRESS_SF_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_ADDRESS_SF_UPD" 
 AFTER UPDATE OF
 STREET_NAME      ,
 SUITE_APT        ,
 D_AREA_CODE      ,
 D_PHONE_NO       ,
 EXTENSION        ,
 H_AREA_CODE      ,
 H_PHONE_NO       ,
 EMAIL            ,
 USPS_ID          ,
 INTL_ADDRESS_1   ,
 INTL_ADDRESS_2   ,
 INTL_ADDRESS_3   ,
 COUNTRY_NAME     ,
 INTL_POSTAL_CODE ,
 ALT_STREET_NAME  ,
 ALT_SUITE_APT    ,
 ALT_USPS_ID      ,
 M_AREA_CODE      ,
 M_PHONE_NO
 ON  DONOR_ADDRESSES FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'DONOR_ADDRESSES';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF nvl(v_sts,' ') = 'Y' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'PROFILE';
        controller_rec.transaction_id        := null;
        controller_rec.donor_id              := :old.donor_id;
        controller_rec.insert_date           := SYSDATE;
        controller_rec.program_id            := lv_tableName || '_UPD';
        sf_api.insert_donor_controller(controller_rec);
    END IF;
END;

/
ALTER TRIGGER "DONSYS"."DONOR_ADDRESS_SF_UPD" ENABLE;
