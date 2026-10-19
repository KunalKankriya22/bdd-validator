--------------------------------------------------------
--  DDL for Trigger GRADED_DONATIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."GRADED_DONATIONS_BI" 
 BEFORE INSERT
 ON GRADED_DONATIONS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    /*-- Added by Touqeer for GRADED_DONATIONS with no SSN  on Dated: 09/30/08
-*/
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
end ;
/
ALTER TRIGGER "DONSYS"."GRADED_DONATIONS_BI" ENABLE;
