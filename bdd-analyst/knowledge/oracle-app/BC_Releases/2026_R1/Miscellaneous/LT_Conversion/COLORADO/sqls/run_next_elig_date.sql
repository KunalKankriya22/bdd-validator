Declare
 cursor next_elig_cur is select donor_id, max(term_date) TDATE from
               donor_interdictions where donor_id in
                (select donor_id from mw_next_elig_date )
               group by donor_id;

 pl_next_elig_date  date;                         
Begin
 for Z in next_elig_cur Loop
  select next_elig_date into pl_next_elig_date from mw_next_elig_date
   where donor_id=Z.donor_id;
  
  update donor_interdictions set term_date=pl_next_elig_date - 1 where
   donor_id=Z.donor_id and term_date=Z.TDATE;
   
 end loop;
 commit;
End;

