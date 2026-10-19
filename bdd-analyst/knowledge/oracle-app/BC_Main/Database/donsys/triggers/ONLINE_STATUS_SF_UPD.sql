--------------------------------------------------------
--  DDL for Trigger ONLINE_STATUS_SF_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."ONLINE_STATUS_SF_UPD" 
 AFTER INSERT OR UPDATE OF STATUS_FLAG
 ON ONLINE_STATUS
 FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   lv_tableName CONSTANT VARCHAR2(30) := 'ONLINE_STATUS';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF v_sts = 'Y' AND :new.STATUS_FLAG in ('C','D','W') THEN
        CASE
            WHEN INSERTING THEN
                controller_rec.program_id       := lv_tableName || '_INS';
                controller_rec.transaction_id   := :NEW.TRANSACTION_ID;
                controller_rec.coll_date        := :NEW.DRIVE_DATE;
                controller_rec.donor_id         := :NEW.donor_id;                
            WHEN UPDATING THEN
                controller_rec.program_id       := lv_tableName || '_UPD';
                controller_rec.transaction_id   := :OLD.TRANSACTION_ID;
                controller_rec.coll_date        := :OLD.DRIVE_DATE;
                controller_rec.donor_id         := :OLD.donor_id;                
        END CASE;

        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := NULL;
        controller_rec.insert_date           := SYSDATE;

        sf_api.insert_donor_controller(controller_rec);

    END IF;
END;
/
ALTER TRIGGER "DONSYS"."ONLINE_STATUS_SF_UPD" ENABLE;
