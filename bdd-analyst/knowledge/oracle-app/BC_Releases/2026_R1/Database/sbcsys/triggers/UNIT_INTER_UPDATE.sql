--------------------------------------------------------
--  DDL for Trigger UNIT_INTER_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_INTER_UPDATE" 
before update
of coll_date, chapter_id
on unit_interdictions
for each row
declare
	aud_rec      unit_interdictions_audit%rowtype;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
  	if nvl(:old.coll_date,sysdate) !=
  	   nvl(:new.coll_date,sysdate)
  	then
  	   aud_rec.coll_date := nvl(:new.coll_date,'01-JAN-33');
   	end if;
  	if nvl(:old.chapter_id,'*') !=
  	   nvl(:new.chapter_id,'*')
  	then
  	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
   	end if;
	insert into unit_interdictions_audit
	(
		unit_id, coll_date, chapter_id,
		inter_code, insert_dats, inter_user_id,
		source_test_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		aud_rec.unit_id , aud_rec.coll_date , aud_rec.chapter_id ,
		aud_rec.inter_code , aud_rec.insert_dats , aud_rec.inter_user_id ,
		aud_rec.source_test_id , aud_rec.audit_key , aud_rec.program_id ,
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "UNIT_INTER_UPDATE" ENABLE;
