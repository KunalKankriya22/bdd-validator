--------------------------------------------------------
--  DDL for Trigger VALID_ATTRIBUTES_DON_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ATTRIBUTES_DON_BI" 
 BEFORE INSERT
 ON VALID_ATTRIBUTES_DON
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into VALID_ATTRIBUTES_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		attrib_code,
		attrib_table,
		required,
		attrib_group,
		attrib_desc,
		sort_sequence,
		valid_code_type,
		default_value,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.attrib_code,
		:new.attrib_table,
		:new.required,
		:new.attrib_group,
		:new.attrib_desc,
		:new.sort_sequence,
		:new.valid_code_type,
		:new.default_value,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_ATTRIBUTES_DON_BI" ENABLE;
