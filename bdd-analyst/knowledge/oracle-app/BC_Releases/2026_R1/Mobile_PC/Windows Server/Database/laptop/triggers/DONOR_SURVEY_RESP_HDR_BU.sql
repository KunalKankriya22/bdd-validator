--------------------------------------------------------
--  DDL for Trigger DONOR_SURVEY_RESP_HDR_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_SURVEY_RESP_HDR_BU" BEFORE
    UPDATE ON donor_survey_resp_hdr
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('DONOR_SURVEY_RESP_HDR', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_SURVEY_RESP_HDR_BU" ENABLE;
