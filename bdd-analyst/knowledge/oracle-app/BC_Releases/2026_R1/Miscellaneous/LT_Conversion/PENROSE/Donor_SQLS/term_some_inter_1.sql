update donor_interdictions set term_Date=eff_date where inter_code in
('AGE','BLD','DOC','ILL','IMM','MED','MIS','SEE','SOB','TP','TSD','WGT','WLK')
/
Update donor_interdictions set term_date=eff_date+30 where inter_code in
('ASM','ULC')
/
Update donor_interdictions set term_date=eff_date+14 where inter_code in
('CLD','TMP')
/
update donor_interdictions set term_date=eff_date+3 where inter_code in
('DEN')
/
update donor_interdictions set term_date=eff_date+1 where inter_code in
('HBP','HGB','PUL')
/
update donor_interdictions set term_date=eff_date+21 where inter_code in
('INF')
/
update donor_interdictions set term_date=eff_date+90 where inter_code in
('MON')
/
update donor_interdictions set term_date=eff_date+42 where inter_code in
('PRG')
/
update donor_interdictions set term_date=eff_date+60 where inter_code in
('SUR')
/
update donor_interdictions set term_date=eff_date+365 where inter_code
in ('COC')
/

