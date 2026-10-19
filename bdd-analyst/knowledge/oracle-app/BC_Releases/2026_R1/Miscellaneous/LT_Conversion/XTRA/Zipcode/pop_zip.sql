declare
 cursor zip_cur is select * from city_state_zip;
 usps_id_value number:=1000;
 nExist NUMBER:=0;
 rCount number:=0;
begin
 dbms_output.enable(1000000);

  FOR d_rec in zip_cur loop
   begin
    usps_id_value:=usps_id_value+1;
    select nvl(count(*),0) into nExist from valid_city_state
    where upper(city)=upper(d_rec.city) and
          upper(state)=upper(d_rec.state) and
          zip=d_rec.zip;

   If nExist = 0 then
     rCount:=rCount+1;
    Insert into valid_city_state values(
                usps_id_value,
                d_rec.city,
                d_rec.state,
                d_rec.zip,
                null,null,null,null,d_rec.county,
                null,null,null,
                sysdate,
                null,
                'MDW_CONV',
                SYSDATE,
                'DONSYS',
                NULL);

   End If;
 exception when others then
   dbms_output.put_line(d_rec.city||'  '||d_rec.state||
        '      -'|| substr(sqlerrm,1,50));
 end;
  commit;
END LOOP;
   dbms_output.put_line('Records moved='||to_char(rCount));
END;
