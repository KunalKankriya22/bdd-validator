--------------------------------------------------------
--  DDL for Trigger COMPONENT_CGMP_BEFORE_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_CGMP_BEFORE_UPDATE" 
  BEFORE UPDATE
  on  COMPONENT_CGMP
  FOR each row
declare
	aud_rec      component_cgmp_audit%rowtype;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
	if nvl(:old.unit_id,'*') != nvl(:new.unit_id,'*') then
	       aud_rec.unit_id:= nvl(:new.unit_id,'*');
	end if;
	if nvl(:old.chapter_id,'*') != nvl(:new.chapter_id,'*') then
	       aud_rec.chapter_id:= nvl(:new.chapter_id,'*');
	end if;
	if nvl(:old.product_code,'*') != nvl(:new.product_code,'*') then
	       aud_rec.product_code:= nvl(:new.product_code,'*');
	end if;
	if nvl(:old.aliquot,0) != nvl(:new.aliquot,0) then
	       aud_rec.aliquot:= :new.aliquot;
	end if;
	if nvl(:old.parm_code,'*') != nvl(:new.parm_code,'*') then
	       aud_rec.parm_code:= nvl(:new.parm_code,'*');
	end if;
	if nvl(:old.parm_value,'*') != nvl(:new.parm_value,'*') then
	       aud_rec.parm_value:= nvl(:new.parm_value,'*');
	end if;
	if nvl(:old.equip_reference,'*') != nvl(:new.equip_reference,'*') then
	       aud_rec.equip_reference:= nvl(:new.equip_reference,'*');
	end if;
	if nvl(:old.process_dats,to_date('01-jan-80 23:59','DD-MON-YY HH24:MI'))
 !=
	   nvl(:new.process_dats,to_date('01-jan-80 23:59','DD-MON-YY HH24:MI')) then
	       aud_rec.process_dats:= :new.process_dats;
	end if;
	if nvl(:old.coll_date,'01-jan-80') !=
	  nvl(:new.coll_date,'01-jan-80') then
	  aud_rec.coll_date:= :new.coll_date;
	end if;
	if nvl(:old.insert_dats,'01-jan-80') !=
	nvl(:new.insert_dats,'01-jan-80') then
	aud_rec.insert_dats:= :new.insert_dats;
	end if;
	if nvl(:old.insert_user ,'*') != nvl(:new.insert_user ,'*') then
	       aud_rec.insert_user := nvl(:new.insert_user ,'*');
	end if;
	if nvl(:old.program_id,'*') != nvl(:new.program_id,'*') then
	       aud_rec.program_id:= nvl(:new.program_id,'*');
	end if;
	insert into component_cgmp_audit
	(
     unit_id, coll_date, chapter_id, product_code, aliquot,
    parm_code, parm_value, equip_reference, process_dats, insert_dats,
    insert_user, audit_key, program_id, audit_insert_dats,
    audit_insert_user
	)
	values
	(
     aud_rec.unit_id, aud_rec.coll_date, aud_rec.chapter_id,
     aud_rec.product_code, aud_rec.aliquot, aud_rec.parm_code,
     aud_rec.parm_value, aud_rec.equip_reference, aud_rec.process_dats,
     aud_rec.insert_dats, aud_rec.insert_user, aud_rec.audit_key,
     aud_rec.program_id, sysdate,lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "COMPONENT_CGMP_BEFORE_UPDATE" ENABLE;
