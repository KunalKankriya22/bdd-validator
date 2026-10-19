--------------------------------------------------------
--  DDL for Trigger RGT_TEST_MATRIX_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TEST_MATRIX_BD" BEFORE DELETE ON rgt_test_matrix FOR EACH ROW
BEGIN
	INSERT INTO RGT_TEST_MATRIX_audit
	(
		chapter_id
		,contract_id
		,test_id
		,cbc_test_id
		,program_id
		,insert_user_id
		,eff_date
		,last_modified_date
		,term_date
		,audit_key
		,audit_insert_dats
		,audit_insert_user
	)
	VALUES
	(
		:OLD.chapter_id
		,:OLD.contract_id
		,:OLD.test_id
		,:OLD.cbc_test_id
		,:OLD.program_id
		,:OLD.insert_user_id
		,:OLD.eff_date
		,SYSDATE     --   :OLD.last_modified_date   -- Commented on 09/12/2011
		,:OLD.term_date
		,:OLD.audit_key
		,SYSDATE
		,lt_user_session.get_userid
	)
	;
END;
/
ALTER TRIGGER "RGT_TEST_MATRIX_BD" ENABLE;
