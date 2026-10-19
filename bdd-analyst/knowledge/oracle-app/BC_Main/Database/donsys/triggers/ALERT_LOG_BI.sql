--------------------------------------------------------
--  DDL for Trigger ALERT_LOG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."ALERT_LOG_BI" 
 BEFORE INSERT
 ON ALERT_LOG
 FOR EACH ROW
BEGIN
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."ALERT_LOG_BI" ENABLE;
