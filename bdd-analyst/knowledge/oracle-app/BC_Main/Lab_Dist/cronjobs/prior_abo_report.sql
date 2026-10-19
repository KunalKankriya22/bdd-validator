set serveroutput on;
SET pages 60;
SET lines 132;
spool prior_abo_report
DECLARE
   temp_inter_id   varchar2(10);
   header_text     varchar2(128);
   page_count      number(3);
   line_count      number(3);
CURSOR get_text IS
   SELECT '1' sq_no,
          null reason_code, 
          null unit_id,
          'Donor to Lab Prior ABO Interface: '||interface_id||
          '                               '||
          ' Interface Date: '|| to_char(start_time, 'MM-DD-YY HH24:MI')||
          '          Page: ' TEXT
     FROM interface_log
    WHERE interface_id = temp_inter_id
   UNION
   SELECT '2',
          null,
          null, 
          '          Total units attempted: '||to_char(no_of_units,'9999')||
          '          '||
          'Completed: '||to_char(complete_count, '9999')||
          '          '||
          'Partial: '||to_char(partial_count, '9999')||
          '          '||
          'Rejected: '||to_char(no_xfer_count, '9999') 
     FROM interface_log
    WHERE interface_id = temp_inter_id
   UNION
   SELECT '3',
          null, 
          null, 
          '---------------------------------------------------  UNITS COMPLET'||
          'LY INTERFACED  ---------------------------------------------------'
     FROM dual
   UNION
   SELECT '4',
          reason_code, 
          interface_log_excp.unit_id,
          rpad(interface_log_excp.unit_id,10)||'  '||
		  to_char(coll_Date, 'MM-DD-YY')||
	          '               '||reason_code||':    '||code_desc
     FROM units, interface_log_excp, master_codes
    WHERE interface_id = temp_inter_id
      AND reason_code = 'INTOK'
      AND code_type = 'NOINR'
      AND code = reason_code
      AND interface_log_excp.unit_id = units.unit_id
   UNION
   SELECT '5',
          null, 
          null, 
        'PB-------------------------------------------------------  UNITS NOT'||
          ' INTERFACED  -----------------------------------------------------'
     FROM dual
    WHERE EXISTS
          (SELECT 'X'
             FROM interface_log_excp
            WHERE interface_id = temp_inter_id
              AND reason_code != 'INTOK')
   UNION
   SELECT '6',
          reason_code,
          interface_log_excp.unit_id,
          rpad(interface_log_excp.unit_id,10)||'  '||
		  to_char(coll_Date, 'MM-DD-YY')||
	          '               '||reason_code||':    '||code_desc
     FROM units, interface_log_excp, master_codes
    WHERE interface_id = temp_inter_id
      AND code_type = 'NOINR'
      AND code = reason_code
      AND interface_log_excp.unit_id = units.unit_id
      AND interface_log_excp.unit_id in 
          (SELECT unit_id
             FROM interface_log_excp
            WHERE interface_id = temp_inter_id
              AND reason_code != 'INTOK');
BEGIN
   DBMS_OUTPUT.enable (200000);
   SELECT MAX(interface_id)
     INTO temp_inter_id
     FROM interface_log
    WHERE program_id = 'DNLBU';
   page_count := '1';
   line_count := '1';
   FOR c1 in get_text LOOP
IF ((page_count = 1) AND (line_count = 1)) THEN  
   header_text := c1.text;
   dbms_output.put_line (''||header_text||to_char(page_count,'99'));
   dbms_output.put_line ('----------------------------------------'||
                         '----------------------------------------'||
                         '----------------------------------------'||
                         '------------');
   dbms_output.put_line ('.');
   line_count := 4;
ELSE
   IF (line_count = 1) THEN
      dbms_output.put_line (''||header_text||to_char(page_count,'99'));
      dbms_output.put_line ('----------------------------------------'||
                            '----------------------------------------'||
                            '----------------------------------------'||
                            '------------');
      dbms_output.put_line ('.');
      line_count := 5;
      dbms_output.put_line (c1.text);
   ELSE
      IF (substr(c1.text,1,2) = 'PB') THEN
         page_count := page_count + 1;
         dbms_output.put_line (''||header_text||to_char(page_count,'99'));
         dbms_output.put_line ('----------------------------------------'||
                               '----------------------------------------'||
                               '----------------------------------------'||
                               '------------');
         dbms_output.put_line ('.');
         line_count := 5;
         dbms_output.put_line (substr(c1.text,3,132));
      ELSE
         dbms_output.put_line (c1.text);
         line_count := line_count + 1;
         IF (line_count >= 58) THEN
            line_count := 1;
            page_count := page_count + 1;
         END IF;
      END IF;
   END IF;
END IF;
END LOOP;
END;
/
spool off
exit;
