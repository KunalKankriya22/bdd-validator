--------------------------------------------------------
--  DDL for Trigger COMPONENTS_SF_INTERFACE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENTS_SF_INTERFACE" 
 AFTER INSERT OR UPDATE OR DELETE OF PRODUCT_CODE, RELABEL_PRODUCT_CODE, REJECT_REASON_CODE
 ON COMPONENTS
 FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec SF_LAB_CONTROLLER%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'COMPONENTS';
   FUNCTION is_real_product_code(prod_code_in IN VARCHAR2) RETURN BOOLEAN IS
        prodCount NUMBER;
   BEGIN
        SELECT COUNT(1) INTO prodCount
          FROM valid_products
         WHERE product_code = SUBSTR(prod_code_in, 0, 5)
           AND SYSDATE BETWEEN eff_date AND NVL(term_date, SYSDATE + 1)
           AND NVL(dummy_product_flag,'X') <> 'Y';

        RETURN prodCount > 0;
   END is_real_product_code;
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF v_sts = 'Y' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'COMPONENT';
        controller_rec.insert_date           := SYSDATE;
        CASE
            WHEN INSERTING THEN
                IF is_real_product_code(:new.product_code) THEN
                    controller_rec.unit_id               := :new.unit_id;
                    controller_rec.coll_date             := :new.coll_date;
                    controller_rec.product_code          := :new.product_code;
                    controller_rec.status                := 'NEW';
                    controller_rec.program_id            := lv_tableName || '_INS';
                    INSERT INTO sf_lab_controller
                    VALUES controller_rec;
                END IF;
            WHEN UPDATING THEN
                -- REJECT scenario
                IF  :new.product_code = :old.product_code
                    AND :new.reject_reason_code IS NOT NULL
                    AND :new.relabel_product_code IS NULL
                THEN
                    IF is_real_product_code(:old.product_code) THEN
                        controller_rec.unit_id               := :old.unit_id;
                        controller_rec.coll_date             := :old.coll_date;
                        controller_rec.product_code          := :old.product_code;
                        controller_rec.status                := 'REJECT';
                        controller_rec.program_id            := lv_tableName || '_UPD';
                        INSERT INTO sf_lab_controller
                        VALUES controller_rec;
                    END IF;
                -- CONVERT scenario
                -- New product code that is inserted is handled by after insert case.
                -- below code is for assigning the CONVERT status to the existing product code that was converted.
                ELSIF  :new.product_code = :old.product_code
                        AND :new.reject_reason_code IS NOT NULL
                        AND :new.relabel_product_code IS NOT NULL
                THEN
                    IF is_real_product_code(:old.product_code) THEN
                        controller_rec.unit_id               := :old.unit_id;
                        controller_rec.coll_date             := :old.coll_date;
                        controller_rec.product_code          := :old.product_code;
                        controller_rec.status                := 'CONVERT';
                        controller_rec.program_id            := lv_tableName || '_UPD';
                        INSERT INTO sf_lab_controller
                        VALUES controller_rec;
                    END IF;
                -- MODIFY scenario
                -- Updated product code will have NEW status.
                -- Old product code will have MODIFY status.
                ELSIF  :new.product_code <> :old.product_code
                THEN
                    -- old product code
                    controller_rec.unit_id               := :old.unit_id;
                    controller_rec.coll_date             := :old.coll_date;
                    controller_rec.product_code          := :old.product_code;
                    controller_rec.status                := 'MODIFY';
                    controller_rec.program_id            := lv_tableName || '_UPD';
                    IF is_real_product_code(:old.product_code) THEN
                        INSERT INTO sf_lab_controller
                        VALUES controller_rec;
                    END IF;
                    -- new product code
                    controller_rec.product_code          := :new.product_code;
                    controller_rec.status                := 'NEW';
                    IF is_real_product_code(:new.product_code) THEN
                        INSERT INTO sf_lab_controller
                        VALUES controller_rec;
                    END IF;
                END IF;
            WHEN DELETING THEN
                IF is_real_product_code(:old.product_code) THEN
                    controller_rec.unit_id               := :old.unit_id;
                    controller_rec.coll_date             := :old.coll_date;
                    controller_rec.product_code          := :old.product_code;
                    controller_rec.status                := 'DELETE';
                    controller_rec.program_id            := lv_tableName || '_DEL';
                    INSERT INTO sf_lab_controller
                    VALUES controller_rec;
                END IF;
            END CASE;
    END IF;
END;
/
ALTER TRIGGER "COMPONENTS_SF_INTERFACE" ENABLE;
