---
tags:
  - trigger
  - SBCSYS
---
# PRODUCT_MATRIX_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/PRODUCT_MATRIX|PRODUCT_MATRIX]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
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
```
