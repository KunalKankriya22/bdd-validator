--------------------------------------------------------
--  DDL for Trigger RGT_RESULTS_MATRIX_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_RESULTS_MATRIX_BD" BEFORE DELETE ON rgt_results_matrix FOR EACH ROW
BEGIN
	INSERT INTO rgt_results_matrix_audit
	(
		chapter_id
		,contract_id
		,test_id
		,result_status
		,cbc_result_status
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
		,:OLD.result_status
		,:OLD.cbc_result_status
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
ALTER TRIGGER "RGT_RESULTS_MATRIX_BD" ENABLE;
