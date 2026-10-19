--------------------------------------------------------
--  DDL for Trigger UTRS_SF_RESULT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UTRS_SF_RESULT_UPDATE" 
 AFTER UPDATE OF RESULT_STATUS_1 ON
                 UTRS FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   rDate  DATE;
   t_unit_id  varchar2(15);
   controller_rec SF_LAB_CONTROLLER%ROWTYPE;
   lv_tableName VARCHAR2(30) := 'UTRS';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF v_sts = 'Y' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'RESULT';
        controller_rec.insert_date           := SYSDATE;
        controller_rec.program_id            := lv_tableName || '_UPD';

        select max(RESULT_DATE) into rDate
          from SF_LAB_DATA_HIST
         where unit_id=:old.unit_id;

        select max(unit_id) into t_unit_id
          from SF_LAB_CONTROLLER
         where unit_id=:old.unit_id
           and process_event='RESULT';


        IF  rDate is null and t_unit_id is null then
            controller_rec.unit_id       :=:old.unit_id;
            controller_rec.coll_date     :=:old.coll_date;
            controller_rec.product_code  :=NULL;
            controller_rec.status        :=NULL;

            INSERT INTO sf_lab_controller
            VALUES controller_rec;

        ELSE
            null;
        END IF;

    END IF;
END;
/
ALTER TRIGGER "UTRS_SF_RESULT_UPDATE" ENABLE;
