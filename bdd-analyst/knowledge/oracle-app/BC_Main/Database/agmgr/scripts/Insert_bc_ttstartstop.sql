DELETE FROM bc_ttstartstop WHERE label_type = 'AGTTAG';

INSERT INTO bc_ttstartstop (line_no, label_type, start_code, stop_code)
  WITH lines AS ( 
    SELECT 1, 'AGTTAG', '^XA',                          NULL    FROM dual UNION ALL 
    SELECT 2, 'AGTTAG', '^FO40,30^BCN,50,N,N,N^FD',    '^FS'   FROM dual UNION ALL 
    SELECT 3, 'AGTTAG', '^FO490,30^A0,N,24,24^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 4, 'AGTTAG', '^FO490,60^A0,N,24,24^FD',      '^FS'   FROM dual UNION ALL
    SELECT 5, 'AGTTAG', '^FO20,100^GB700,1,4,B,0',      '^FS'   FROM dual UNION ALL 
    SELECT 6, 'AGTTAG', '^FO20,110^A0,N,28,28^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 7, 'AGTTAG', '^FO30,150^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL    
    SELECT 8, 'AGTTAG', '^FO30,190^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL    
    SELECT 9, 'AGTTAG', '^FO30,230^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 10, 'AGTTAG', '^FO20,270^GB700,1,4,B,0',      '^FS'   FROM dual UNION ALL 
    SELECT 11, 'AGTTAG', '^FO20,280^A0,N,28,28^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 12, 'AGTTAG', '^FO30,320^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL    
    SELECT 13, 'AGTTAG', '^FO30,360^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 14, 'AGTTAG', '^FO30,400^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 15, 'AGTTAG', '^FO20,440^GB700,1,4,B,0',      '^FS'   FROM dual UNION ALL 
    SELECT 16, 'AGTTAG', '^FO20,450^A0,N,28,28^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 17, 'AGTTAG', '^FO30,490^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL    
    SELECT 18, 'AGTTAG', '^FO30,530^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 19, 'AGTTAG', '^FO20,570^GB700,1,4,B,0',      '^FS'   FROM dual UNION ALL 
    SELECT 20, 'AGTTAG', '^FO20,580^A0,N,28,28^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 21, 'AGTTAG', '^FO30,620^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL    
    SELECT 22, 'AGTTAG', '^FO30,660^A0,N,23,23^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 23, 'AGTTAG', '^FO20,700^A0,N,28,28^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 24, 'AGTTAG', '^FO0,740^A0,N,50,50^FD',      '^FS'   FROM dual UNION ALL 
    SELECT 25, 'AGTTAG', '^FO40,780^BCN,50,N,N,N^FD',   '^FS'   FROM dual UNION ALL    
    SELECT 26, 'AGTTAG', '^FO490,780^A0,N,24,24^FD',     '^FS'   FROM dual UNION ALL 
    SELECT 27, 'AGTTAG', '^FO490,810^A0,N,24,24^FD',    '^FS'   FROM dual UNION ALL
    SELECT 28, 'AGTTAG', '^FO30,850^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL    
    SELECT 29, 'AGTTAG', '^FO30,890^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL 
    SELECT 30, 'AGTTAG', '^FO30,930^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 30, 'AGTTAG', '^FO30,970^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 32, 'AGTTAG', '^FO30,1010^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 33, 'AGTTAG', '^FO30,1050^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 34, 'AGTTAG', '^FO30,1090^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 35, 'AGTTAG', '^FO30,1130^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 36, 'AGTTAG', '^FO30,1170^A0,N,23,23^FD',     '^FS'   FROM dual UNION ALL   
    SELECT 37, 'AGTTAG', '^XZ',                          NULL    FROM dual
  ) 
  SELECT * FROM lines;