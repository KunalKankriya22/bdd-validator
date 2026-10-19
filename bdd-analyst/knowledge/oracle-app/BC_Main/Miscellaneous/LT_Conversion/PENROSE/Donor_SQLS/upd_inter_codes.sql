update mw_donor_interdictions mwi set inter_code=
                   (select inter_code from valid_interdictions where
                    old_inter=mwi.inter_code)
where mwi.inter_code in ( select distinct inter_code from
                        mw_donor_interdictions mdi1
                       where mdi1.inter_code not in (
                                    select inter_code from
                                    valid_interdictions)
                       )
/
