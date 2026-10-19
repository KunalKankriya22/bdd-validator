--------------------------------------------------------
--  DDL for Trigger CONTRACTS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CONTRACTS_BEFORE_DELETE" 
before delete
on contracts
for each row
begin
    insert into contracts_audit
	(
		contract_id,chapter_id,company,contract_type,
		address_id,machine_code,tax_id_form,
		center_id,bar_code_protocol,unit_id_pattern,
		edi_input_ind,result_output_ind,
		confirm_test_flag,
		eff_date,term_date,last_modified_date,
		note_id,audit_key,
		program_id,audit_insert_dats, audit_insert_user,
		CBC_CHAPTER_ID, UNIT_ID_TYPE,
		RESULTS_METHOD, OD_REPORTING_METHOD, PO_NO,
		PLATE_CAPACITY, PROFILE_SEQ_NO, ALT_E_LEVEL,
		ALT_SE_LEVEL, RED_TUBE_COUNT,PURBLE_TUBE_COUNT,PURPLE_TUBE_COUNT,
		EMAIL_ID,COPY_ISBT_FLAG,DUP_CHECKIN_FLAG,NO_OF_DUPLICATES

	)
	values
	(
		:old.contract_id,:old.chapter_id,:old.company,:old.contract_type,
		:old.address_id,:old.machine_code,:old.tax_id_form,
		:old.center_id,:old.bar_code_protocol,:old.unit_id_pattern,
		:old.edi_input_ind,:old.result_output_ind,
		:old.confirm_test_flag,
		:old.eff_date,:old.term_date,:old.last_modified_date,
		:old.note_id,:old.audit_key,
		:old.program_id, sysdate, lt_user_session.get_userid,
		:old.CBC_CHAPTER_ID, :old.UNIT_ID_TYPE,
		:old.RESULTS_METHOD, :old.OD_REPORTING_METHOD, :old.PO_NO,
		:old.PLATE_CAPACITY, :old.PROFILE_SEQ_NO, :old.ALT_E_LEVEL,
		:old.ALT_SE_LEVEL, :old.RED_TUBE_COUNT,:old.PURBLE_TUBE_COUNT,:old.PURPLE_TUBE_COUNT,
		:old.EMAIL_ID,:old.COPY_ISBT_FLAG,:old.DUP_CHECKIN_FLAG,:old.NO_OF_DUPLICATES
);
end;
/
ALTER TRIGGER "CONTRACTS_BEFORE_DELETE" ENABLE;
