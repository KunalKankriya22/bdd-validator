--------------------------------------------------------
--  DDL for Trigger DONORS_SF_UPD_INTERFACE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONORS_SF_UPD_INTERFACE" 
 AFTER UPDATE OF GENDER , DATE_OF_BIRTH , LAST_NAME,SSN,
                 LAST_NAME_SUFFIX,ETHNIC_GROUP,DONOR_WEIGHT,
                 HEIGHT, FIRST_NAME, MIDDLE_NAME, BLOOD_TYPE ON
                 DONORS FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'DONORS';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF nvl(v_sts,' ') = 'Y' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'PROFILE';
        controller_rec.transaction_id        := '';
        controller_rec.coll_date             := '';
        controller_rec.donor_id              := :old.donor_id;
        controller_rec.insert_date           := SYSDATE;
        controller_rec.program_id            := lv_tableName || '_UPD';
        sf_api.insert_donor_controller(controller_rec);
    END IF;
END;

/
ALTER TRIGGER "DONSYS"."DONORS_SF_UPD_INTERFACE" ENABLE;
