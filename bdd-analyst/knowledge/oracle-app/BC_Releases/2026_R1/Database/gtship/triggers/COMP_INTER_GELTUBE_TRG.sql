--------------------------------------------------------
--  DDL for Trigger COMP_INTER_GELTUBE_TRG
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMP_INTER_GELTUBE_TRG" 
 FOR INSERT ON "SBCSYS"."COMPONENT_INTERDICTIONS"
 COMPOUND TRIGGER
    TYPE unit_prod_code_rt IS RECORD(
        unit_id COMPONENT_INTERDICTIONS.UNIT_ID%TYPE,
        product_code COMPONENT_INTERDICTIONS.PRODUCT_CODE%TYPE
    );

    TYPE row_info_t IS TABLE OF unit_prod_code_rt INDEX BY PLS_INTEGER;

    g_row_info row_info_t;
    gv_hold_interCode VARCHAR2(30);

    FUNCTION get_hold_inter_code RETURN VARCHAR2 IS
        lv_interHoldCode VARCHAR2(30);
    BEGIN
        SELECT TRIM(code_desc) INTO lv_interHoldCode -- MLT 4750 (PHLD hardcoding removed)
          FROM vserv_master
         WHERE code_type = 'EBLFL'
           AND code = 'HOLD'
           AND SYSDATE BETWEEN eff_date AND NVL(term_date, SYSDATE + 10);
        RETURN lv_interHoldCode;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END get_hold_inter_code;

    AFTER EACH ROW IS
        lv_feature_flag VARCHAR2(10) := 'N';
        nCnt NUMBER;
    BEGIN
        gv_hold_interCode := get_hold_inter_code;

        IF gv_hold_interCode IS NOT NULL
            AND :NEW.INTER_CODE = gv_hold_interCode THEN
            SELECT max(parameter_value) INTO lv_feature_flag
             FROM valid_parameters
            WHERE parameter_code = 'GELTUBE_PL';

            IF lv_feature_flag = 'Y' THEN
                g_row_info (g_row_info.COUNT + 1).unit_id := :NEW.unit_id;
                g_row_info (g_row_info.COUNT).product_code := :NEW.product_code;
            END IF;
        END IF;
    END AFTER EACH ROW;

    AFTER STATEMENT IS
        nCnt    NUMBER;
    BEGIN
        FOR indx IN 1 .. g_row_info.COUNT
        LOOP
            SELECT COUNT(1) INTO nCnt
              FROM geltube_plasma_details
             WHERE unit_id = g_row_info(indx).unit_id
               AND prod_code = g_row_info(indx).product_code
               AND checkin_date IS NOT NULL;

            IF nCnt > 0 THEN
                DELETE FROM component_interdictions
                  WHERE unit_id = g_row_info(indx).unit_id
                    AND product_code = g_row_info(indx).product_code
                    AND inter_code = gv_hold_interCode;
            END IF;
        END LOOP;
    END AFTER STATEMENT;
END COMP_INTER_GELTUBE_TRG;
/
ALTER TRIGGER "COMP_INTER_GELTUBE_TRG" ENABLE;
