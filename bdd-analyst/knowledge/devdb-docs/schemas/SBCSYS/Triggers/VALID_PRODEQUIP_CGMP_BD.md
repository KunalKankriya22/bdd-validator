---
tags:
  - trigger
  - SBCSYS
---
# VALID_PRODEQUIP_CGMP_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PRODEQUIP_CGMP|VALID_PRODEQUIP_CGMP]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into VALID_PRODEQUIP_CGMP_AUDIT
	(EQUIP_TYPE,PROC,PRODUCT_CODE,PARM_CODE,
         ACCEPT_MIN,ACCEPT_MAX,EFF_DATE,LAST_MODIFY_DATE,TERM_DATE,
         AUDIT_KEY,PROGRAM_ID,AUDIT_INSERT_USER,AUDIT_INSERT_DATE)
	values
	( :old.EQUIP_TYPE, :old.PROC, :old.PRODUCT_CODE, :old.PARM_CODE,
	  :old.ACCEPT_MIN, :old.ACCEPT_MAX, :old.EFF_DATE,:old.LAST_MODIFY_DATE,:old.term_date,
          :old.audit_key, 'DELETE', lt_user_session.get_userid, sysdate);
end;
```
