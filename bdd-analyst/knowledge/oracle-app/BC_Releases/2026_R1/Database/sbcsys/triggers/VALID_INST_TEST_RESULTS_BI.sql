--------------------------------------------------------
--  DDL for Trigger VALID_INST_TEST_RESULTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INST_TEST_RESULTS_BI" 
before insert
on valid_instrument_test_results
for each row
declare
	temp_audit_key	  number(23);
	nCount		  number := 0;
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    -- Check if the table is institution level
    select nvl(count(*),0)
      into nCount
      from institution_tables
     where table_name = 'VALID_INSTRUMENT_TEST_RESULTS' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
    If nCount > 0 then
      :new.chapter_id := 'ALL';
    End If;
    --
    insert into valid_inst_test_results_audit
	(
		chapter_id,
		machine_id,
		test_id,
		result_status,
		machine_result_status,
		eff_date,
		term_date,
		insert_user_id,
		insert_date,
		last_modified_date,
		program_id,
		audit_key,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:new.chapter_id,
		:new.machine_id,
		:new.test_id,
		:new.result_status,
		:new.machine_result_status,
		:new.eff_date,
		:new.term_date,
		:new.insert_user_id,
		:new.insert_date,
		:new.last_modified_date,
		:new.program_id,
		:new.audit_key,
		sysdate,lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_INST_TEST_RESULTS_BI" ENABLE;
