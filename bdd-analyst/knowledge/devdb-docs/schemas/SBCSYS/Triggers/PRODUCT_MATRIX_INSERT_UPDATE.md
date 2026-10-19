---
tags:
  - trigger
  - SBCSYS
---
# PRODUCT_MATRIX_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/PRODUCT_MATRIX|PRODUCT_MATRIX]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
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
```
