--------------------------------------------------------
--  DDL for Trigger DONOR_SURVEY_RESP_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_SURVEY_RESP_DET_BU" BEFORE
    UPDATE ON donor_survey_resp_det
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('DONOR_SURVEY_RESP_DET', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_SURVEY_RESP_DET_BU" ENABLE;
