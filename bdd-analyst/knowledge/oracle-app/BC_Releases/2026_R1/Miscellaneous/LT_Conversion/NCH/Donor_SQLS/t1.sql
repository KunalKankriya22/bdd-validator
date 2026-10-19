select inter_code,old_inter from valid_interdictions where old_inter
in (select distinct inter_code from mw_donor_interdictions
where inter_code not in (select inter_code from valid_interdictions))
/
