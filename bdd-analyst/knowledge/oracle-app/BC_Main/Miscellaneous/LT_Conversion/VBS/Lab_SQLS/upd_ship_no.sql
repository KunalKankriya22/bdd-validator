Declare
  cursor c1 is select * from convert_products 
               where shipped_to is not null
               and convert_flag in ('S','U','X')
               and ship_ticket_no is null and
               rownum <500000
    order by shipped_to,ship_date
    for update of ship_ticket_no;
  szShipDate   Date;
  szShippedTo    varchar2(20);
Begin
for j  in 1 .. 20 loop
  FOR c1_rec in c1 loop
    szShipDate:=nvl(c1_rec.ship_date,c1_rec.TRANSFUSED_DATE) ;
    If szShipDate is null then 
      szShipDate:=trunc(sysdate);
    End If;

    szShippedTo:=c1_rec.shipped_to;

     UPDATE convert_products set ship_ticket_no=szShippedTo||
     To_char(szShipDate,'mmddyy') where
     current of c1;
  -- commit;

  End Loop;
commit;
END LOOP;

END;

/
commit
/



