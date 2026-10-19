--------------------------------------------------------
--  DDL for Trigger CONTRACT_TESTS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CONTRACT_TESTS_BEFORE_DELETE" 
before delete
on contract_tests
for each row
begin
    insert into contract_tests_audit
	(
		contract_id,chapter_id,test_id,
		stop_label_flag,
		eff_date,term_date,last_modified_date,
		audit_key,program_id, audit_insert_dats, audit_insert_user,EXTRACT
	 )
	values
	(
		:old.contract_id,:old.chapter_id,:old.test_id,
		:old.stop_label_flag,
		:old.eff_date,:old.term_date,:old.last_modified_date,
		:old.audit_key,'DELETE',sysdate, lt_user_session.get_userid,:old.EXTRACT
	 );
end;
/
ALTER TRIGGER "CONTRACT_TESTS_BEFORE_DELETE" ENABLE;
