---
tags:
  - trigger
  - DONSYS
---
# VALID_HLA_EPITOPES_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HLA_EPITOPES|VALID_HLA_EPITOPES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_HLA_EPITOPES' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into VALID_HLA_EPITOPES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		hla_standard,
		chapter_id,
		public_epitope_id,
		associated_epitope_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.hla_standard,
		:new.chapter_id,
		:new.public_epitope_id,
		:new.associated_epitope_id,
		:new.eff_date,
		:new.term_date
	);
end;
```
