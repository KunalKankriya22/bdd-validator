update donors 
set middle_name=translate(middle_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ.',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where middle_name like '%.%'
/

update donors
set middle_name=translate(middle_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ,',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where middle_name like '%,%'
/
update donors
set middle_name=translate(middle_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ(',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where middle_name like '%(%'
/
update donors
set middle_name=translate(middle_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ)',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where middle_name like '%)%'
/
-------------------------------
update donors
set first_name=translate(first_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ.',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where first_name like '%.%'
/
update donors
set first_name=translate(first_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ,',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where first_name like '%,%'
/
update donors
set first_name=translate(first_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ(',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where first_name like '%(%'
/
update donors
set first_name=translate(first_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ)',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where first_name like '%)%'
/


commit
/

