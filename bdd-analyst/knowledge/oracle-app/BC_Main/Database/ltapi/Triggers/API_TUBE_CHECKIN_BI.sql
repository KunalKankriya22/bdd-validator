--------------------------------------------------------
--  DDL for Trigger API_TUBE_CHECKIN_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "API_TUBE_CHECKIN_BI" 
BEFORE INSERT
ON API_TUBE_CHECKIN
FOR EACH ROW
BEGIN


if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;


end ;
/
ALTER TRIGGER "API_TUBE_CHECKIN_BI" ENABLE;
