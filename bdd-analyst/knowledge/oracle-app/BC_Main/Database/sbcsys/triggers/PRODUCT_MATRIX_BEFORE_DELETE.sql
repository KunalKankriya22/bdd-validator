--------------------------------------------------------
--  DDL for Trigger PRODUCT_MATRIX_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PRODUCT_MATRIX_BEFORE_DELETE" before delete
on product_matrix for each row
begin
	   insert into product_matrix_audit
      (
	       bag_code,set_id,product_type,
		audit_key,program_id,
		 audit_insert_dats, audit_insert_user
	  )
	   values
	    (
		     :old.bag_code,:old.set_id,:old.product_type,
	      :old.audit_key,'DELETE',
	       sysdate, lt_user_session.get_userid
	);
   end;
/
ALTER TRIGGER "PRODUCT_MATRIX_BEFORE_DELETE" ENABLE;
