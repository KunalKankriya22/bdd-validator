-- Invalid Objects Detection Script for Oracle Database
-- Purpose: Identify and analyze all invalid database objects
-- Features: Comprehensive object validation, error reporting, remediation suggestions
-- Usage: Execute in SQL*Plus or Oracle SQL Developer

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET PAGESIZE 0;
SET LINESIZE 4000;
SET FEEDBACK ON;
SET HEADING ON;
SET VERIFY OFF;

DECLARE
    v_total_invalid NUMBER := 0;
    v_total_objects NUMBER := 0;
    v_error_count NUMBER := 0;
    v_compile_script CLOB := '';
    
    CURSOR c_invalid_objects IS
        SELECT object_name, object_type, status, last_ddl_time, owner
        FROM all_objects 
        WHERE status = 'INVALID'
        ORDER BY object_type, object_name;
        
    CURSOR c_object_errors(p_object_name VARCHAR2, p_object_type VARCHAR2) IS
        SELECT line, position, text
        FROM all_errors
        WHERE name = p_object_name
        AND type = p_object_type
        ORDER BY sequence;
        
    CURSOR c_dependencies(p_object_name VARCHAR2, p_object_type VARCHAR2) IS
        SELECT referenced_name, referenced_type, referenced_owner
        FROM all_dependencies
        WHERE name = p_object_name
        AND type = p_object_type
        AND referenced_owner = USER;

BEGIN
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    DBMS_OUTPUT.PUT_LINE('Oracle Database Invalid Objects Analysis Report');
    DBMS_OUTPUT.PUT_LINE('Generated on: ' || TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'));
    DBMS_OUTPUT.PUT_LINE('Database User: ' || USER);
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Get total object count
    SELECT COUNT(*) INTO v_total_objects FROM all_objects;
    
    -- Get invalid object count
    SELECT COUNT(*) INTO v_total_invalid FROM all_objects WHERE status = 'INVALID';
    
    DBMS_OUTPUT.PUT_LINE('1. SUMMARY');
    DBMS_OUTPUT.PUT_LINE('----------');
    DBMS_OUTPUT.PUT_LINE('Total Objects in Schema: ' || v_total_objects);
    DBMS_OUTPUT.PUT_LINE('Invalid Objects Found: ' || v_total_invalid);
    
    IF v_total_invalid = 0 THEN
        DBMS_OUTPUT.PUT_LINE('✓ No invalid objects found - Database schema is healthy!');
        DBMS_OUTPUT.PUT_LINE('');
        RETURN;
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('Invalid Object Percentage: ' || ROUND((v_total_invalid/v_total_objects)*100, 2) || '%');
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Summary by object type
    DBMS_OUTPUT.PUT_LINE('2. INVALID OBJECTS BY TYPE');
    DBMS_OUTPUT.PUT_LINE('---------------------------');
    
    FOR type_summary IN (
        SELECT object_type, COUNT(*) as count_invalid
        FROM all_objects 
        WHERE status = 'INVALID'
        GROUP BY object_type
        ORDER BY COUNT(*) DESC, object_type
    ) LOOP
        DBMS_OUTPUT.PUT_LINE(RPAD(type_summary.object_type, 20) || ': ' || type_summary.count_invalid || ' invalid');
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Detailed invalid objects analysis
    DBMS_OUTPUT.PUT_LINE('3. DETAILED INVALID OBJECTS ANALYSIS');
    DBMS_OUTPUT.PUT_LINE('------------------------------------');
    
    FOR obj IN c_invalid_objects LOOP
        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Object: ' || obj.object_name || ' (' || obj.object_type || ')');
        DBMS_OUTPUT.PUT_LINE('Status: ' || obj.status);
        DBMS_OUTPUT.PUT_LINE('Last DDL: ' || TO_CHAR(obj.last_ddl_time, 'YYYY-MM-DD HH24:MI:SS'));
        DBMS_OUTPUT.PUT_LINE('Owner: ' || obj.owner);
        
        -- Get compilation errors
        v_error_count := 0;
        FOR err IN c_object_errors(obj.object_name, obj.object_type) LOOP
            IF v_error_count = 0 THEN
                DBMS_OUTPUT.PUT_LINE('Compilation Errors:');
            END IF;
            DBMS_OUTPUT.PUT_LINE('  Line ' || err.line || ', Position ' || err.position || ': ' || err.text);
            v_error_count := v_error_count + 1;
        END LOOP;
        
        IF v_error_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('Compilation Errors: None found (may be dependency-related)');
        END IF;
        
        -- Get dependencies
        DBMS_OUTPUT.PUT_LINE('Dependencies:');
        v_error_count := 0;
        FOR dep IN c_dependencies(obj.object_name, obj.object_type) LOOP
            DBMS_OUTPUT.PUT_LINE('  Depends on: ' || dep.referenced_name || ' (' || dep.referenced_type || ')');
            v_error_count := v_error_count + 1;
        END LOOP;
        
        IF v_error_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  No dependencies found');
        END IF;
        
        -- Generate compile statement
        IF obj.object_type IN ('PROCEDURE', 'FUNCTION', 'PACKAGE', 'PACKAGE BODY', 'TRIGGER', 'VIEW', 'MATERIALIZED VIEW') THEN
            IF obj.object_type = 'PACKAGE BODY' THEN
                v_compile_script := v_compile_script || 'ALTER PACKAGE ' || obj.object_name || ' COMPILE BODY;' || CHR(10);
            ELSIF obj.object_type = 'MATERIALIZED VIEW' THEN
                v_compile_script := v_compile_script || 'ALTER MATERIALIZED VIEW ' || obj.object_name || ' COMPILE;' || CHR(10);
            ELSE
                v_compile_script := v_compile_script || 'ALTER ' || obj.object_type || ' ' || obj.object_name || ' COMPILE;' || CHR(10);
            END IF;
        END IF;
        
        DBMS_OUTPUT.PUT_LINE(RPAD('-', 60, '-'));
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Dependency chain analysis
    DBMS_OUTPUT.PUT_LINE('4. DEPENDENCY CHAIN ANALYSIS');
    DBMS_OUTPUT.PUT_LINE('-----------------------------');
    
    FOR dep_chain IN (
        SELECT LEVEL as dependency_level, 
               name, 
               type,
               referenced_name,
               referenced_type
        FROM all_dependencies
        WHERE referenced_owner = USER
        START WITH name IN (SELECT object_name FROM all_objects WHERE status = 'INVALID')
        CONNECT BY PRIOR referenced_name = name
        AND PRIOR referenced_type = type
        ORDER BY dependency_level, name
    ) LOOP
        DBMS_OUTPUT.PUT_LINE(RPAD(' ', (dep_chain.dependency_level-1)*2) || 
                           dep_chain.name || ' (' || dep_chain.type || ') -> ' ||
                           dep_chain.referenced_name || ' (' || dep_chain.referenced_type || ')');
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Objects that might be causing invalidity
    DBMS_OUTPUT.PUT_LINE('5. POTENTIALLY PROBLEMATIC DEPENDENCIES');
    DBMS_OUTPUT.PUT_LINE('---------------------------------------');
    
    FOR prob_dep IN (
        SELECT DISTINCT d.referenced_name, d.referenced_type, o.status
        FROM all_dependencies d
        JOIN all_objects o ON d.referenced_name = o.object_name 
                           AND d.referenced_type = o.object_type
        WHERE d.name IN (SELECT object_name FROM all_objects WHERE status = 'INVALID')
        AND o.status = 'INVALID'
        ORDER BY d.referenced_type, d.referenced_name
    ) LOOP
        DBMS_OUTPUT.PUT_LINE('⚠ ' || prob_dep.referenced_name || ' (' || prob_dep.referenced_type || ') - Status: ' || prob_dep.status);
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Remediation suggestions
    DBMS_OUTPUT.PUT_LINE('6. REMEDIATION SCRIPT');
    DBMS_OUTPUT.PUT_LINE('---------------------');
    DBMS_OUTPUT.PUT_LINE('-- Copy and execute the following commands to attempt recompilation:');
    DBMS_OUTPUT.PUT_LINE('');
    
    IF LENGTH(v_compile_script) > 0 THEN
        DBMS_OUTPUT.PUT_LINE('-- Individual object compilation:');
        DBMS_OUTPUT.PUT_LINE(v_compile_script);
        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('-- Alternative: Compile all invalid objects at once:');
        DBMS_OUTPUT.PUT_LINE('BEGIN');
        DBMS_OUTPUT.PUT_LINE('  FOR obj IN (SELECT object_name, object_type FROM all_objects WHERE status = ''INVALID'') LOOP');
        DBMS_OUTPUT.PUT_LINE('    BEGIN');
        DBMS_OUTPUT.PUT_LINE('      IF obj.object_type = ''PACKAGE BODY'' THEN');
        DBMS_OUTPUT.PUT_LINE('        EXECUTE IMMEDIATE ''ALTER PACKAGE '' || obj.object_name || '' COMPILE BODY'';');
        DBMS_OUTPUT.PUT_LINE('      ELSIF obj.object_type = ''MATERIALIZED VIEW'' THEN');
        DBMS_OUTPUT.PUT_LINE('        EXECUTE IMMEDIATE ''ALTER MATERIALIZED VIEW '' || obj.object_name || '' COMPILE'';');
        DBMS_OUTPUT.PUT_LINE('      ELSIF obj.object_type IN (''PROCEDURE'', ''FUNCTION'', ''PACKAGE'', ''TRIGGER'', ''VIEW'') THEN');
        DBMS_OUTPUT.PUT_LINE('        EXECUTE IMMEDIATE ''ALTER '' || obj.object_type || '' '' || obj.object_name || '' COMPILE'';');
        DBMS_OUTPUT.PUT_LINE('      END IF;');
        DBMS_OUTPUT.PUT_LINE('      DBMS_OUTPUT.PUT_LINE(''Compiled: '' || obj.object_name);');
        DBMS_OUTPUT.PUT_LINE('    EXCEPTION');
        DBMS_OUTPUT.PUT_LINE('      WHEN OTHERS THEN');
        DBMS_OUTPUT.PUT_LINE('        DBMS_OUTPUT.PUT_LINE(''Failed to compile '' || obj.object_name || '': '' || SQLERRM);');
        DBMS_OUTPUT.PUT_LINE('    END;');
        DBMS_OUTPUT.PUT_LINE('  END LOOP;');
        DBMS_OUTPUT.PUT_LINE('END;');
        DBMS_OUTPUT.PUT_LINE('/');
    ELSE
        DBMS_OUTPUT.PUT_LINE('-- No compilable objects found');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('');
    
    -- Additional recommendations
    DBMS_OUTPUT.PUT_LINE('7. ADDITIONAL RECOMMENDATIONS');
    DBMS_OUTPUT.PUT_LINE('------------------------------');
    DBMS_OUTPUT.PUT_LINE('1. Review compilation errors above for syntax or logic issues');
    DBMS_OUTPUT.PUT_LINE('2. Check if referenced objects exist and are valid');
    DBMS_OUTPUT.PUT_LINE('3. Verify user privileges on dependent objects');
    DBMS_OUTPUT.PUT_LINE('4. Consider recompiling in dependency order (bottom-up)');
    DBMS_OUTPUT.PUT_LINE('5. For persistent issues, check Oracle alert logs');
    DBMS_OUTPUT.PUT_LINE('6. Run this script again after remediation to verify fixes');
    
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('8. SYSTEM UTILITIES');
    DBMS_OUTPUT.PUT_LINE('-------------------');
    DBMS_OUTPUT.PUT_LINE('-- Oracle built-in compilation utility:');
    DBMS_OUTPUT.PUT_LINE('-- EXEC DBMS_UTILITY.COMPILE_SCHEMA(''' || USER || ''');');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('-- Recompile all invalid objects (Oracle 10g+):');
    DBMS_OUTPUT.PUT_LINE('-- @$ORACLE_HOME/rdbms/admin/utlrp.sql');
    
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    DBMS_OUTPUT.PUT_LINE('End of Invalid Objects Analysis Report');
    DBMS_OUTPUT.PUT_LINE('=================================================================');
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        DBMS_OUTPUT.PUT_LINE('Please check your database connection and privileges.');
        RAISE;
END;
/

-- Reset SQL*Plus settings
SET FEEDBACK ON;
SET HEADING ON;
SET VERIFY ON;

-- Quick verification query
PROMPT
PROMPT Quick Invalid Objects Summary:
PROMPT ==============================
SELECT object_type, COUNT(*) as invalid_count
FROM all_objects 
WHERE status = 'INVALID'
GROUP BY object_type
ORDER BY COUNT(*) DESC, object_type;

PROMPT
PROMPT To re-run this analysis: @invalid_objects_check.sql
PROMPT
