UPDATE mw_test_results set unit_id=' '||unit_id where
     Length(Unit_id)=6 and substr(Unit_id,1,1) in
         ('G','F','E','C','H','J','K','L','M','N','P','Q','R','S','T',
          'V','W','X','Y','Z') and
          ltrim(substr(Unit_id,2),'0987654321') is null;

UPDATE mw_test_results set 
 Unit_id=' '||substr(Unit_id,1,1)||substr(Unit_id,3,5)
where Length(Unit_id) = 7 and 
   substr(Unit_id,1,1) in ('G','F','E','C','H','J','K','L',
             'M','N','P','Q','R','S','T', 'V','W','X','Y','Z') and
        substr(Unit_id,2,1)=' ' ;

