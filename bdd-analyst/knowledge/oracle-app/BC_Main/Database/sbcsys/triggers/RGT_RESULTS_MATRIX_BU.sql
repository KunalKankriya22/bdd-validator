--------------------------------------------------------
--  DDL for Trigger RGT_RESULTS_MATRIX_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_RESULTS_MATRIX_BU" BEFORE UPDATE ON RGT_RESULTS_MATRIX FOR EACH ROW
DECLARE
	aud_rec      RGT_RESULTS_MATRIX_audit%ROWTYPE;
BEGIN
    SELECT	DECODE(NVL(:OLD.chapter_id,'*'),NVL(:NEW.chapter_id,'*'),:OLD.chapter_id,:NEW.chapter_id)
    		,DECODE(NVL(:OLD.contract_id,'*'),NVL(:NEW.contract_id,'*'),:OLD.contract_id,:NEW.contract_id)
    		,DECODE(NVL(:OLD.test_id,'*'),NVL(:NEW.test_id,'*'),:OLD.test_id,:NEW.test_id)
		,DECODE(NVL(:OLD.RESULT_STATUS,'*'),NVL(:NEW.RESULT_STATUS,'*'),:OLD.RESULT_STATUS,:NEW.RESULT_STATUS)
    		,DECODE(NVL(:OLD.CBC_RESULT_STATUS,'*'),NVL(:NEW.CBC_RESULT_STATUS,'*'),:OLD.CBC_RESULT_STATUS,:NEW.CBC_RESULT_STATUS)
    		,:NEW.program_id
    		,DECODE(NVL(:OLD.insert_user_id,'*'),NVL(:NEW.insert_user_id,'*'),:OLD.insert_user_id,:NEW.insert_user_id)
    		,DECODE(NVL(:OLD.eff_date,TO_DATE ('01-JAN-33')),NVL(:NEW.eff_date,TO_DATE ('01-JAN-33')),:OLD.eff_date,:NEW.eff_date)
		,SYSDATE
    		,DECODE(NVL(:OLD.term_date,TO_DATE ('01-JAN-33')),NVL(:NEW.term_date,TO_DATE ('01-JAN-33')),:OLD.term_date,:NEW.term_date)
    		,:OLD.audit_key
    		,SYSDATE
    		,lt_user_session.get_userid
    INTO	aud_rec.chapter_id
    		,aud_rec.contract_id
    		,aud_rec.test_id
		,aud_rec.RESULT_STATUS
    		,aud_rec.CBC_RESULT_STATUS
    		,aud_rec.program_id
    		,aud_rec.insert_user_id
    		,aud_rec.eff_date
    		,aud_rec.last_modIFied_date
    		,aud_rec.term_date
    		,aud_rec.audit_key
    		,aud_rec.audit_insert_dats
    		,aud_rec.audit_insert_user
	FROM DUAL
	;

	INSERT INTO RGT_RESULTS_MATRIX_audit
	VALUES aud_rec
	;
END;
/
ALTER TRIGGER "RGT_RESULTS_MATRIX_BU" ENABLE;
