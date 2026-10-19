--------------------------------------------------------
--  DDL for Trigger DONATIONS_SF_UPD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONATIONS_SF_UPD" 
 AFTER UPDATE OF DONOR_ID , UNIT_ID , VOID_UNIT_ID ON
                 DONATIONS FOR EACH ROW
DECLARE
    v_sts VARCHAR2(10) := 'N';
    controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
    lv_tableName CONSTANT VARCHAR2(30) :=  'DONATIONS';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF nvl(v_sts,' ') = 'Y' then
        If  :NEW.donor_id is not null then
            controller_rec.under_processing_flag := 'X';
            controller_rec.process_event         := 'DONATION';
            controller_rec.transaction_id        := :old.transaction_id;
            controller_rec.coll_date             := :old.coll_date;
            controller_rec.donor_id              := :New.donor_id;
            controller_rec.insert_date           := SYSDATE;
            controller_rec.program_id            := lv_tableName || '_UPD';
            sf_api.insert_donor_controller(controller_rec);
            If  :old.donor_id is not null THEN    -- This is to handle reattching a differnt donor
                If :new.donor_id!= :old.donor_id then
                    controller_rec.process_event         :='ELIGIBILITY';
                    sf_api.insert_donor_controller(controller_rec);
                End If;
            End If;
        ELSIF :NEW.DONOR_ID IS NULL THEN -- DETACH scenario
            IF :OLD.DONOR_ID IS NOT NULL THEN
                controller_rec.under_processing_flag := 'X';
                controller_rec.process_event         := 'DELETE';
                controller_rec.transaction_id        := :old.transaction_id;
                controller_rec.coll_date             := :old.coll_date;
                controller_rec.donor_id              := :old.donor_id;
                controller_rec.insert_date           := SYSDATE;
                controller_rec.program_id            := lv_tableName || '_UPD';
                sf_api.insert_donor_controller(controller_rec);
                controller_rec.process_event         := 'PROFILE';
                controller_rec.transaction_id        := null;
                controller_rec.coll_date             := null;
                sf_api.insert_donor_controller(controller_rec);
            END IF;
        END IF;
    END IF;
END;

/
ALTER TRIGGER "DONSYS"."DONATIONS_SF_UPD" ENABLE;
