CREATE OR REPLACE TRIGGER OPS$SBCSYS.LABEL_PRINT_LOG_BI
before insert
on LABEL_PRINT_LOG
for each row
BEGIN

  If :new.program_id in ('LAILABE2','LAILABEL') then
     declare
       ncount number:=0;
       p_status   varchar2(300);
     begin
      select nvl(count(*),0) into nCount from master_codes
      where code_type='IRPRD' and code=substr(:new.product_code,1,5) and 
      sysdate between eff_date and nvl(term_date,sysdate+1);

      If nCount > 0 then 
          PLACE_REMOVE_INTER.ins_comp_inter(:new.unit_id,:new.product_code,'STOR',
                                            sysdate,:new.user_id,p_status);
      end if;
     END;
 Else
   Null;
 End If;

END;
/

