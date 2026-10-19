--------------------------------------------------------
--  DDL for Trigger VALID_TESTS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_TESTS_INSERT_UPDATE" 
before insert  or update
on valid_tests
for each row
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_tests_audit
	(
		test_id,test_desc,
		test_short_id, test_group,
		antigen_flag, edit_result_flag,
		discrepancy_flag, eff_date,term_date,
		last_modified_date,SERVICE_CODE, TESTING_CHARGES_CURR,
		TESTING_CHARGES_NEW, IMPLEMENT_DATS, NO_OF_TECH,
		FULL_TECH_2, AUTO_SCHEDULE,
		audit_key, program_id, audit_insert_dats,audit_insert_user
	)
	values
	(
		:new.test_id,:new.test_desc,
		:new.test_short_id, :new.test_group,
		:new.antigen_flag, :new.edit_result_flag,
		:new.discrepancy_flag, :new.eff_date,:new.term_date,
		:new.last_modified_date,:new.SERVICE_CODE, :new.TESTING_CHARGES_CURR,
		:new.TESTING_CHARGES_NEW,:new.IMPLEMENT_DATS, :new.NO_OF_TECH,
		:new.FULL_TECH_2, :new.AUTO_SCHEDULE,
		:new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_TESTS_INSERT_UPDATE" ENABLE;
