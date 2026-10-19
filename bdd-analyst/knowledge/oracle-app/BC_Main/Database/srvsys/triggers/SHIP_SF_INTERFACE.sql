--------------------------------------------------------
--  DDL for Trigger SHIP_SF_INTERFACE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "SHIP_SF_INTERFACE" AFTER INSERT OR UPDATE OF STOCK_STATE
 ON SHIPPED_PRODUCTS
 FOR EACH ROW
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec sf_lab_controller%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'SHIPPED_PRODUCTS';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF v_sts = 'Y' AND :new.stock_state = 'SH' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'SHIPMENT';
        controller_rec.status                := NULL;
        controller_rec.insert_date           := SYSDATE;
        controller_rec.unit_id               := :new.unit_id;
        controller_rec.coll_date             := :new.coll_date;
        controller_rec.product_code          := :new.product_code;

        CASE
            WHEN INSERTING THEN
                controller_rec.program_id    := lv_tableName || '_INS';
                INSERT INTO sf_lab_controller
                VALUES controller_rec;
            WHEN UPDATING THEN
                controller_rec.program_id    := lv_tableName || '_UPD';
                INSERT INTO sf_lab_controller
                VALUES controller_rec;
        END CASE;
    END IF;
END;
/
ALTER TRIGGER "SHIP_SF_INTERFACE" ENABLE;
