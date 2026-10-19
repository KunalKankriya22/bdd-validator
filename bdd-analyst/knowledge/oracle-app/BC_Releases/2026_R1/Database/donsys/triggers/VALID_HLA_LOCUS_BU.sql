--------------------------------------------------------
--  DDL for Trigger VALID_HLA_LOCUS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HLA_LOCUS_BU" 
 BEFORE UPDATE
 ON VALID_HLA_LOCUS
 FOR EACH ROW
BEGIN
	insert into VALID_HLA_LOCUS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		epitope_id,
		chapter_id,
		locus,
		epitope_super_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.epitope_id,
		:new.chapter_id,
		:new.locus,
		:new.epitope_super_id,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HLA_LOCUS_BU" ENABLE;
