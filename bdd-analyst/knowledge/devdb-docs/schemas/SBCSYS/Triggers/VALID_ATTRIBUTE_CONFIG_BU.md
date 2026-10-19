---
tags:
  - trigger
  - SBCSYS
---
# VALID_ATTRIBUTE_CONFIG_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ATTRIBUTE_CONFIG|VALID_ATTRIBUTE_CONFIG]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    aud_rec      VALID_ATTRIBUTE_CONFIG_AUDIT%rowtype;
    nCount       NUMBER := 0;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
	   aud_rec.CHAPTER_ID := nvl(:new.CHAPTER_ID,'*');
 	end if;

	if nvl(:old.PRODUCT_TYPE,'*') !=
	   nvl(:new.PRODUCT_TYPE,'*')
	then
	   aud_rec.PRODUCT_TYPE := nvl(:new.PRODUCT_TYPE,'*');
 	end if;

	if nvl(:old.ATTRIB_CLASS,'*') !=
	   nvl(:new.ATTRIB_CLASS,'*')
	then
	   aud_rec.ATTRIB_CLASS := nvl(:new.ATTRIB_CLASS,'*');
 	end if;

	if nvl(:old.ATTRIB_CODE,'*') !=
	   nvl(:new.ATTRIB_CODE,'*')
	then
	   aud_rec.ATTRIB_CODE := nvl(:new.ATTRIB_CODE,'*');
 	end if;

	if nvl(:old.ATTRIB_MODIFIER,'*') !=
	   nvl(:new.ATTRIB_MODIFIER,'*')
	then
	   aud_rec.ATTRIB_MODIFIER := nvl(:new.ATTRIB_MODIFIER,'*');
 	end if;

	if nvl(:old.EFF_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.EFF_DATE := nvl(:new.EFF_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.TERM_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.TERM_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.TERM_DATE := nvl(:new.TERM_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.MODIFIED_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.MODIFIED_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.MODIFIED_DATE := nvl(:new.MODIFIED_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.LAST_MODIFIED_BY,'*') !=
	   nvl(:new.LAST_MODIFIED_BY,'*')
	then
	   aud_rec.LAST_MODIFIED_BY := nvl(:new.LAST_MODIFIED_BY,'*');
 	end if;

	if nvl(:old.INSERT_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.INSERT_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.INSERT_DATE := nvl(:new.INSERT_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.INSERT_USER,'*') !=
	   nvl(:new.INSERT_USER,'*')
	then
	   aud_rec.INSERT_USER := nvl(:new.INSERT_USER,'*');
 	end if;

	if nvl(:old.FCN_NAME,'*') !=
	   nvl(:new.FCN_NAME,'*')
	then
	   aud_rec.FCN_NAME := nvl(:new.FCN_NAME,'*');
 	end if;


	insert into SBCSYS.VALID_ATTRIBUTE_CONFIG_audit
	(
		CHAPTER_ID,PRODUCT_TYPE,ATTRIB_CLASS,
		ATTRIB_CODE,ATTRIB_MODIFIER,EFF_DATE,
		TERM_DATE,MODIFIED_DATE,LAST_MODIFIED_BY,
		INSERT_DATE,INSERT_USER,PROGRAM_ID,FCN_NAME,
		AUDIT_KEY,AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		aud_rec.CHAPTER_ID, aud_rec.PRODUCT_TYPE, aud_rec.ATTRIB_CLASS,
		aud_rec.ATTRIB_CODE, aud_rec.ATTRIB_MODIFIER, aud_rec.EFF_DATE,
		aud_rec.TERM_DATE,aud_rec.MODIFIED_DATE,aud_rec.LAST_MODIFIED_BY,
		aud_rec.INSERT_DATE, aud_rec.INSERT_USER, aud_rec.PROGRAM_ID, aud_rec.FCN_NAME,
		aud_rec.AUDIT_KEY,SYSDATE , lt_user_session.get_userid

	);
end;
```
