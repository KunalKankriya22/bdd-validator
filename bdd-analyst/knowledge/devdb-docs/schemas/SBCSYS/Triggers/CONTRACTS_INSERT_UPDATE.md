---
tags:
  - trigger
  - SBCSYS
---
# CONTRACTS_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/CONTRACTS|CONTRACTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --:new.last_modified_date := sysdate ; -- Commented by Kishore on 05/24/2011. IM 5356
    --
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
		:new.contract_id,:new.chapter_id,:new.company,:new.contract_type,
		:new.address_id,:new.machine_code,:new.tax_id_form,
		:new.center_id,:new.bar_code_protocol,:new.unit_id_pattern,
		:new.edi_input_ind,:new.result_output_ind,
		:new.confirm_test_flag,
		:new.eff_date,:new.term_date,:new.last_modified_date,
		:new.note_id,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid,
		:new.CBC_CHAPTER_ID, :new.UNIT_ID_TYPE,
		:new.RESULTS_METHOD, :new.OD_REPORTING_METHOD, :new.PO_NO,
		:new.PLATE_CAPACITY, :new.PROFILE_SEQ_NO, :new.ALT_E_LEVEL,
		:new.ALT_SE_LEVEL, :new.RED_TUBE_COUNT,:new.PURBLE_TUBE_COUNT,:new.PURPLE_TUBE_COUNT,
		:new.EMAIL_ID,:new.COPY_ISBT_FLAG,:new.DUP_CHECKIN_FLAG,:new.NO_OF_DUPLICATES
	);
end;
```
