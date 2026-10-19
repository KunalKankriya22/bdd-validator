---
tags:
  - trigger
  - GTSHIP
---
# COMP_GELTUBE_TRG

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENTS|COMPONENTS]]
**Type**: AFTER EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   lv_feature_flag VARCHAR2(10) := 'N';
   lc_plasmaProductType VARCHAR2(5) := 'PRTPL';
   checkin_details_rec GELTUBE_PLASMA_DETAILS%ROWTYPE;

   FUNCTION is_plasma_product_code(prod_code_in IN VARCHAR2) RETURN BOOLEAN IS
        prodCount NUMBER;
   BEGIN
        SELECT COUNT(1) INTO prodCount
          FROM valid_products
         WHERE product_code = substr(prod_code_in, 0, 5)
           AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate + 1)
           AND product_type IN (
                SELECT code
                  FROM vserv_master
                 WHERE code_type = lc_plasmaProductType
                   AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate + 10)
            );

        RETURN prodCount > 0;
   END is_plasma_product_code;

BEGIN
   SELECT max(parameter_value) INTO lv_feature_flag
     FROM valid_parameters
    WHERE parameter_code = 'GELTUBE_PL';

        checkin_details_rec.unit_id             := :NEW.unit_id;
        checkin_details_rec.chapter_id          := :NEW.chapter_id;
        checkin_details_rec.coll_date           := :NEW.coll_date;
        checkin_details_rec.prod_code           := :NEW.product_code;
        checkin_details_rec.insert_date         := SYSDATE;
        checkin_details_rec.program_id          := 'COMPONENTS_GELTUBE_PLASMA';

    IF lv_feature_flag = 'Y' THEN
        CASE
            WHEN INSERTING THEN
                IF is_plasma_product_code(:new.product_code) THEN
                    geltube_plasma.ins_upd_geltube_det(checkin_details_rec);
                END IF;
            WHEN UPDATING THEN
                -- REJECT scenario - no need to delete product code from geltube_details.
                    -- But the status is indicated as red
                -- CONVERT scenario - need to check if relabel product code has to be considered.
                -- MODIFY scenario -- insert, update or delete from geltube_details based on the old and new product codes.
                /*
                -- REJECT scenario
                IF  :new.product_code = :old.product_code
                    AND :new.reject_reason_code IS NOT NULL
                    AND :new.relabel_product_code IS NULL
                THEN
                    IF is_plasma_product_code(:old.product_code) THEN
                        geltube_plasma.del_geltube_det(checkin_details_rec);
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
                */
                -- MODIFY scenario
                -- Updated product code will have NEW status.
                -- Old product code will have MODIFY status.
                IF  :new.product_code <> :old.product_code
                THEN
                    DECLARE
                        lb_geltube_updated BOOLEAN := FALSE;
                    BEGIN
                       IF is_plasma_product_code(:new.product_code) THEN
                            geltube_plasma.ins_upd_geltube_det(checkin_details_rec);
                            lb_geltube_updated := TRUE;
                        END IF;

                        IF NOT lb_geltube_updated AND is_plasma_product_code(:old.product_code) THEN
                            checkin_details_rec.unit_id             := :OLD.unit_id;
                            checkin_details_rec.chapter_id          := :OLD.chapter_id;
                            checkin_details_rec.coll_date           := :OLD.coll_date;
                            checkin_details_rec.prod_code           := :OLD.product_code;
                            geltube_plasma.del_geltube_det(checkin_details_rec);
                        END IF;
                    END;
                END IF;
            WHEN DELETING THEN
                IF is_plasma_product_code(:old.product_code) THEN
                    checkin_details_rec.unit_id             := :OLD.unit_id;
                    checkin_details_rec.chapter_id          := :OLD.chapter_id;
                    checkin_details_rec.coll_date           := :OLD.coll_date;
                    checkin_details_rec.prod_code           := :OLD.product_code;
                    geltube_plasma.del_geltube_det(checkin_details_rec);
                END IF;
            END CASE;
    END IF;
END;

```
