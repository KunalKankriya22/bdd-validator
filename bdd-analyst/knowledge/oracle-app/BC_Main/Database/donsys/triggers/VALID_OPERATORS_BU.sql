--------------------------------------------------------
--  DDL for Trigger VALID_OPERATORS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_OPERATORS_BU" 
 BEFORE UPDATE
 ON VALID_OPERATORS
 FOR EACH ROW
BEGIN
	insert into VALID_OPERATORS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		v_operator,
		v_description,
		v_value_style,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.v_operator,
		:new.v_description,
		:new.v_value_style,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_OPERATORS_BU" ENABLE;
