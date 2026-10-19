--------------------------------------------------------
--  DDL for Trigger VALID_HLA_EPITOPES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HLA_EPITOPES_BU" 
 BEFORE UPDATE
 ON VALID_HLA_EPITOPES
 FOR EACH ROW
BEGIN
	insert into VALID_HLA_EPITOPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		hla_standard,
		chapter_id,
		public_epitope_id,
		associated_epitope_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.hla_standard,
		:new.chapter_id,
		:new.public_epitope_id,
		:new.associated_epitope_id,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HLA_EPITOPES_BU" ENABLE;
