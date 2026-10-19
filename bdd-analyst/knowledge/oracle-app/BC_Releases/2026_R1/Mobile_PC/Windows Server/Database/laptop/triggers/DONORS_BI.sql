--------------------------------------------------------
--  DDL for Trigger DONORS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONORS_BI" 
before insert
on DONORS
for each row
BEGIN
  Declare
     v_audit_key  number:=0;
  Begin
    if :new.insert_user is null then  
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
        into :new.insert_user from dual ;
    end if;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;

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
    /*---- Added by Edwin -- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('DONORS',v_audit_key,'I',null);
   End;


    /*-- Added --KPS -- for Donors with no SSN  --*/
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
/
ALTER TRIGGER "DONORS_BI" ENABLE;
