--------------------------------------------------------
--  DDL for Trigger PRODUCT_MATRIX_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PRODUCT_MATRIX_INSERT_UPDATE" before insert
 or update on product_matrix for each row
declare
	 temp_audit_key    number(23);
    begin
	 if inserting
	  then
		     select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
	      :new.audit_key := temp_audit_key;
     end if;
      :new.program_id := nvl(:new.program_id,'MANUAL');
       insert into product_matrix_audit
	  (
		   bag_code,set_id,product_type,
		    audit_key,program_id,
		     audit_insert_dats, audit_insert_user
      )
       values
	(
		 :new.bag_code,:new.set_id,:new.product_type,
		  :new.audit_key,:new.program_id,
		   sysdate, lt_user_session.get_userid
	    );
       end;
/
ALTER TRIGGER "PRODUCT_MATRIX_INSERT_UPDATE" ENABLE;
