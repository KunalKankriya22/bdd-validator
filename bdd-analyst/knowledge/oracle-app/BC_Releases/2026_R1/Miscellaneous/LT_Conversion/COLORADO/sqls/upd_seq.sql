declare
 cursor seq_cur is select distinct unit_id from mw_donation_comments;

 cursor unit_cur (pl_unit_id in varchar2) is select unit_id,seq from
        mw_donation_comments where unit_id=pl_unit_id order by coll_date;

seq_counter number:=0;
begin
  For z in seq_cur loop
     seq_counter:=1;
    For Z1 in unit_cur (z.unit_id) loop
      update mw_donation_comments set seq=seq_counter
       where unit_id=Z1.unit_id and seq=Z1.seq;
       seq_counter:=seq_counter+1;
    End loop;
 End Loop;
end;

