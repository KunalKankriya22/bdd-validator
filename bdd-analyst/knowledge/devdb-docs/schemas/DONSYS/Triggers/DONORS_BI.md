---
tags:
  - trigger
  - DONSYS
---
# DONORS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONORS|DONORS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
begin
  if :new.insert_user is null then
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  end if;
  if :new.insert_date is null then
    :new.insert_date := sysdate ;
  end if;
  if :new.audit_key is null then
    select audit_seq.nextval into :new.audit_key from dual;
  end if;
    /*-- This part of the trigger was added on request of Jeff --*/
    if :new.first_name is not null then
	select soundex(substr(:new.first_name,1,
	       decode(instr(:new.first_name,' '),0,length(:new.first_name),
	       instr(:new.first_name,' ')-1)) )
	into :new.first_name_sndx
	from dual ;
    end if ;
    SELECT soundex(:new.last_name)
      INTO :new.soundex_key
      FROM dual;
    /*-- Added --KPS -- for Donors with no SSN	--*/
    declare
       v_ssn varchar2(9);
    begin
       select parameter_value
       into v_ssn
       from valid_parameters
       where parameter_code = 'FKSSN'
       and sysdate between eff_date and nvl(term_date,sysdate)
       and rownum = 1;
       if :new.ssn = v_ssn then
	  :new.ssn := null;
       end if;
    exception
       when others then
	  null;
    end;
end;
```
