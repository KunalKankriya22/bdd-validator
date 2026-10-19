update donors 
set first_name=translate(first_name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ.,',
'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
where first_name like '%.%' or first_name like '%,%'
/

