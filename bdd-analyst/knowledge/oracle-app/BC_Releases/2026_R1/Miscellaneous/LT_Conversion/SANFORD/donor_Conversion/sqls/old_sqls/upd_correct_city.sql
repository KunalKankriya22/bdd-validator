DECLARE
c number:=0;
BEGIN
       UPDATE mw_donor_address_information set
             city=decode(city,'TAYLORSCILLE','TAYLORSVILLE',
                              'SP. FORK','SPANISH FORK',
                              'KENNTHWORTH','KENILWORTH',
                              'WASH TERRACE','WASHINGTON TERRACE',
                              'AMERICAN','AMERICAN FORK',
                              'BRIGHAM CIT','BRIGHAM CITY',
                              'W.BOUNTIFUL','WEST BOUNTIFUL',
                              'W. BOUTIFUL','WEST BOUNTIFUL',
                              'TRREMONTON','TREMONTON', 
                              city);
                              
      UPDATE mw_donor_address_information set zip_code='84337'
      where city='TREMONTON';

      UPDATE mw_donor_address_information set zip_code='84087'
      where city='WEST BOUNTIFUL';
   
      
      UPDATE mw_donor_address_information set zip_code='84087'
      where city='WOODSCROSS';
       
      UPDATE mw_donor_address_information set zip_code='84403'
      where city='WASH TERRACE';
COMMIT;
END;
/
