--------------------------------------------------------
--  DDL for Trigger RGT_TEST_MATRIX_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TEST_MATRIX_BU" BEFORE UPDATE ON rgt_test_matrix FOR EACH ROW
DECLARE
	aud_rec      rgt_test_matrix_audit%ROWTYPE;
BEGIN
	aud_rec.audit_key := :OLD.audit_key;
	aud_rec.program_id := :NEW.program_id;
	--
    SELECT	DECODE(NVL(:OLD.chapter_id,'*'),NVL(:NEW.chapter_id,'*'),:OLD.chapter_id,:NEW.chapter_id)
    		,DECODE(NVL(:OLD.contract_id,'*'),NVL(:NEW.contract_id,'*'),:OLD.contract_id,:NEW.contract_id)
    		,DECODE(NVL(:OLD.test_id,'*'),NVL(:NEW.test_id,'*'),:OLD.test_id,:NEW.test_id)
    		,DECODE(NVL(:OLD.cbc_test_id,'*'),NVL(:NEW.cbc_test_id,'*'),:OLD.cbc_test_id,:NEW.cbc_test_id)
    		,:NEW.program_id
    		,DECODE(NVL(:OLD.insert_user_id,'*'),NVL(:NEW.insert_user_id,'*'),:OLD.insert_user_id,:NEW.insert_user_id)
    		,DECODE(NVL(:OLD.eff_date,TO_DATE ('01-JAN-33')),NVL(:NEW.eff_date,TO_DATE ('01-JAN-33')),:OLD.eff_date,:NEW.eff_date)
    		,DECODE(NVL(:OLD.last_modified_date,TO_DATE ('01-JAN-33')),NVL(:NEW.last_modified_date,TO_DATE ('01-JAN-33')),:OLD.last_modified_date,:NEW.last_modified_date)
    		,DECODE(NVL(:OLD.term_date,TO_DATE ('01-JAN-33')),NVL(:NEW.term_date,TO_DATE ('01-JAN-33')),:OLD.term_date,:NEW.term_date)
    		,:OLD.audit_key
    		,SYSDATE
    		,lt_user_session.get_userid
    INTO	aud_rec.chapter_id
    		,aud_rec.contract_id
    		,aud_rec.test_id
    		,aud_rec.cbc_test_id
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

	INSERT INTO rgt_test_matrix_audit
	VALUES aud_rec
	;
END;
/
ALTER TRIGGER "RGT_TEST_MATRIX_BU" ENABLE;
