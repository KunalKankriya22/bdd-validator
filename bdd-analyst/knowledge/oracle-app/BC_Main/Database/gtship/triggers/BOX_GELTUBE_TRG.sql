--------------------------------------------------------
--  DDL for Trigger BOX_GELTUBE_TRG
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "BOX_GELTUBE_TRG" 
 AFTER UPDATE OF SHIPMENT_NO ON "SRVSYS"."BOXES"
 FOR EACH ROW
DECLARE
   lv_feature_flag VARCHAR2(10) := 'N';

BEGIN
   SELECT max(parameter_value) INTO lv_feature_flag
     FROM valid_parameters
    WHERE parameter_code = 'GELTUBE_PL';

    IF lv_feature_flag = 'Y' THEN
        CASE
            WHEN UPDATING THEN
               IF :old.shipment_no is null and :new.shipment_no is not null
                THEN
                  update GELTUBE_PLASMA_PACK set plasma_ship_no=:new.shipment_no
                  where plasma_ship_no='NOT-SHIPPED' and plasma_box_id=:new.box_id;

                  update GELTUBE_PLASMA_BOXES set plasma_ship_no=:new.shipment_no
                  where plasma_ship_no='NOT-SHIPPED' and plasma_box_id=:new.box_id;
              END IF;
            END CASE;
    END IF;
END;
/
ALTER TRIGGER "BOX_GELTUBE_TRG" ENABLE;
