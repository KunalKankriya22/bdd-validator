--------------------------------------------------------
--  DDL for Trigger UTRS_AFTER_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UTRS_AFTER_UPDATE" 
AFTER UPDATE
ON SBCSYS.UTRS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
DECLARE
/******************************************************************************
   NAME:
   PURPOSE:

   REVISIONS:
   Ver        Date        Author           Description
   ---------  ----------  ---------------  ------------------------------------
   1.0        3/2/2012     Kishore         1. Created this trigger.

   NOTES:

   Automatically available Auto Replace Keywords:
      Object Name:
      Sysdate:         3/2/2012
      Date and Time:   3/2/2012, 1:48:31 PM, and 3/2/2012 1:48:31 PM
      Username:         (set in TOAD Options, Proc Templates)
      Table Name:      UTRS (set in the "New PL/SQL Object" dialog)
      Trigger Options:  (set in the "New PL/SQL Object" dialog)
******************************************************************************/

  t_batch_id			 		units.batch_id%type;
  t_contract_id		 		    units.contract_id%type;
  t_dummy				 		varchar2(1);
  t_count				 		number;
  t_prev_qc_test_flag			reset_qc_date_log.prev_qc_test_flag%type;
  t_prev_qc_test_date			reset_qc_date_log.prev_qc_test_date%type;
  t_prev_results_qc_date		reset_qc_date_log.prev_results_qc_date%type;
  t_prev_results_qc_user		reset_qc_date_log.prev_results_qc_user%type;
BEGIN
  -- Changes made by Kishore on 09/16/2011
  -- Check whether the cancel_flag has been changed or not
  if (nvl(:old.cancel_flag,'*') != nvl(:new.cancel_flag,'*')) or
	 (:old.tb_id is not null and :new.tb_id is null) then
	begin
      select batch_id, contract_id
        into t_batch_id, t_contract_id
        from units
       where unit_id = :new.unit_id
         and chapter_id = :new.chapter_id;
    exception
      when no_data_found then
        t_batch_id := null;
	    t_contract_id := null;
      when others then
        t_batch_id := null;
	    t_contract_id := null;
    end;

	-- Check whether record exists in the RESET_QC_DATE_LOG table
	begin
	  select 'x'
	    into t_dummy
		from reset_qc_date_log
	   where chapter_id = :new.chapter_id
		 and contract_id = t_contract_id
		 and batch_id = t_batch_id
		 and unit_id = :new.unit_id
		 and test_id = :new.test_id;
	exception
	  when no_data_found then
	    t_dummy := null;
	  when others then
		t_dummy := null;
	end;

	if :new.extract_date is null and t_dummy = 'x' then

	  begin
	    select count(*)
		  into t_count
		  from utrs
		 where unit_id in (select unit_id
		                     from units
			                where batch_id = t_batch_id
							  and chapter_id = :new.chapter_id)
		   and extract_date is null
		   and chapter_id = :new.chapter_id;
	  end;

	  -- Do not include the count of this test id
	  t_count := t_count - 1;

	  -- If there are other tests that need to be extracted, then do not do anything
	  -- Scenario: Multiple tests added but only some of them are cancelled
	  if t_count > 0 then
		null;
	  else -- Only one test is added and cancelled
		begin
	      select prev_qc_test_flag, prev_qc_test_date,
		         prev_results_qc_date, prev_results_qc_user
		    into t_prev_qc_test_flag, t_prev_qc_test_date,
			     t_prev_results_qc_date, t_prev_results_qc_user
		    from reset_qc_date_log
		   where chapter_id = :new.chapter_id
		     and contract_id = t_contract_id
		     and batch_id = t_batch_id
		     and unit_id = :new.unit_id
		     and test_id = :new.test_id;
		end;

		begin
          update units
             set qc_test_flag = t_prev_qc_test_flag,
                 qc_test_date = t_prev_qc_test_date
           where unit_id = :new.unit_id
             and chapter_id = :new.chapter_id;
        end;

		begin
          update batch_inputs
             set results_qc_date = t_prev_results_qc_date,
                 results_qc_user = t_prev_results_qc_user
           where batch_id = t_batch_id
             and chapter_id = :new.chapter_id
		     and contract_id = t_contract_id;
        end;
	  end if;
	end if;
  end if;
END ;
/
ALTER TRIGGER "UTRS_AFTER_UPDATE" DISABLE;
