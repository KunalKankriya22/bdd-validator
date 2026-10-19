--------------------------------------------------------
--  DDL for Trigger COMPONENT_SP_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "COMPONENT_SP_BEFORE_DELETE" BEFORE DELETE ON SBCSYS.COMPONENT_SP REFERENCING NEW AS NEW OLD AS OLD FOR EACH ROW
declare
	temp_attrib_code  varchar2(5);
	temp_x		  varchar2(1);
begin
    insert into component_sp_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code,
		process_code, insert_user_id,
		note_id, insert_dats,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.component_prefix, :old.product_code,
		:old.process_code, :old.insert_user_id,
		:old.note_id, :old.insert_dats,
		:old.audit_key,'DELETE',sysdate, lt_user_session.get_userid
	);
    if :old.process_code in ('THAW','WASH')
    then
       --
       if :old.process_code = 'THAW'
       then
	  temp_attrib_code := 'THAW';
       end if;
       if :new.process_code = 'WASH'
       then
	  temp_attrib_code := 'SW';
       end if;
       if :new.process_code = 'PLT'
       then
	  temp_attrib_code := 'LRS';
       end if;
       --
       begin
	   --
	   select 'x' into temp_x
	   from   valid_product_attributes
	   where  product_type = ( select product_type from valid_products
			      where product_code = substr(:old.product_code,1,5)
			      and unit_scheme_type = 'I'
			      and sysdate between eff_date
			      and nvl(term_date, sysdate+1) )and
		  attrib_group = 'SP' and
		  attrib_code = temp_attrib_code and
		  sysdate between eff_date and nvl(term_date,sysdate);
	   begin
	       delete from component_attributes
	       where  unit_id = :old.unit_id and
		      coll_date = :old.coll_date and
		      product_code = :old.product_code and
		      chapter_id = :old.chapter_id and
		      attrib_group = 'SP' and
		      attrib_code = temp_attrib_code;
	   end;
	   exception
	       when NO_DATA_FOUND
	       then
		  null;
       end;
    end if;
end;
/
ALTER TRIGGER "COMPONENT_SP_BEFORE_DELETE" ENABLE;
