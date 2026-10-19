---
tags:
  - procedure
  - UTIL
---
# DELETE_DONOR_UNIT_DATA

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Type**: PROCEDURE

## Dependencies

- ALL_TABLES (SYNONYM in PUBLIC)
- ALL_TAB_COLUMNS (SYNONYM in PUBLIC)
- DBMS_OUTPUT (SYNONYM in PUBLIC)
- DBMS_STANDARD (PACKAGE in SYS)
- STANDARD (PACKAGE in SYS)
- SYS_STUB_FOR_PURITY_ANALYSIS (PACKAGE in SYS)

## Source Code

```plsql
procedure delete_donor_unit_data (
   p_donor_id in varchar2,
   p_unit_id  in varchar2
) as
   v_sql           varchar2(4000);
   v_count         number;
   v_total_deleted number := 0;
   v_schema        varchar2(30);
   v_error_msg     varchar2(4000);
   v_table_names   varchar2(20000);
begin
    -- Parameter validation
   if
      p_donor_id is null
      and p_unit_id is null
   then
      raise_application_error(
         -20001,
         'Both donor_id and unit_id cannot be NULL'
      );
   end if;

--    dbms_output.put_line('=== Starting deletion process ===');
   dbms_output.put_line('donor_id: ' || nvl(
      p_donor_id,
      'NULL'
   ));
   dbms_output.put_line('unit_id: ' || nvl(
      p_unit_id,
      'NULL'
   ));
--    dbms_output.put_line('----------------------------------------');

    -- Find and process tables with donor_id or unit_id columns
   for table_rec in (
      with table_columns as (
         select c.owner,
                c.table_name,
                listagg(lower(c.column_name),
                        ',') within group(
                 order by c.column_name) as columns
           from all_tab_columns c,
                all_tables t
          where c.owner = t.owner
            and c.table_name = t.table_name
            and c.owner in ( 'DONSYS',
                             'SBCSYS',
                             'UTIL',
                             'SRVSYS' )
            and lower(c.column_name) in ( 'donor_id',
                                          'unit_id' )
            and c.table_name not like '%_ADT'
            and c.table_name not like '%_AUDIT'
          group by c.owner,
                   c.table_name
      )
      select owner,
             table_name,
             columns as column_names,
             case
                when columns like '%donor_id%'
                   and columns like '%unit_id%'
                   and p_donor_id is not null
                   and p_unit_id is not null then
                   'WHERE donor_id = :1 AND unit_id = :2'
                when columns like '%donor_id%'
                   and p_donor_id is not null then
                   'WHERE donor_id = :1'
                when columns like '%unit_id%'
                   and p_unit_id is not null then
                   'WHERE unit_id = :1'
                else
                   null
             end as where_clause
        from table_columns
   ) loop
      begin
            -- Skip if no valid where clause (based on NULL parameters)
         if table_rec.where_clause is null then
            continue;
         end if;

            -- Count records before deletion
         v_sql := 'SELECT COUNT(*) FROM '
                  || table_rec.owner
                  || '.'
                  || table_rec.table_name
                  || ' '
                  || table_rec.where_clause;

         begin
            if
               table_rec.column_names like '%donor_id%'
               and table_rec.column_names like '%unit_id%'
            then
               execute immediate v_sql
                 into v_count
                  using p_donor_id,p_unit_id;
            elsif table_rec.column_names like '%donor_id%' then
               execute immediate v_sql
                 into v_count
                  using p_donor_id;
            else
               execute immediate v_sql
                 into v_count
                  using p_unit_id;
            end if;

            -- dbms_output.put_line(table_rec.owner
            --                      || '.'
            --                      || table_rec.table_name
            --                      || ': '
            --                      || v_count
            --                      || ' records found');

                -- Only proceed with delete if records exist
            if v_count > 0 then
                    -- Delete records
               v_sql := 'DELETE FROM '
                        || table_rec.owner
                        || '.'
                        || table_rec.table_name
                        || ' '
                        || table_rec.where_clause;

               if
                  table_rec.column_names like '%donor_id%'
                  and table_rec.column_names like '%unit_id%'
               then
                  execute immediate v_sql
                     using p_donor_id,p_unit_id;
               elsif table_rec.column_names like '%donor_id%' then
                  execute immediate v_sql
                     using p_donor_id;
               else
                  execute immediate v_sql
                     using p_unit_id;
               end if;

               v_total_deleted := v_total_deleted + sql%rowcount;
               v_table_names := v_table_names || table_rec.owner || '.' || table_rec.table_name || ',';

            --    dbms_output.put_line(table_rec.owner
            --                         || '.'
            --                         || table_rec.table_name
            --                         || ': '
            --                         || sql%rowcount
            --                         || ' records deleted');
            end if;
         exception
            when others then
               v_error_msg := sqlerrm;
               dbms_output.put_line('Error processing '
                                    || table_rec.owner
                                    || '.'
                                    || table_rec.table_name
                                    || ': '
                                    || v_error_msg);
                    -- Continue with next table
         end;

        --  dbms_output.put_line('----------------------------------------');
      end;
   end loop;

--    dbms_output.put_line('=== Deletion process completed ===');
   dbms_output.put_line('Total records deleted: ' || v_total_deleted);
   dbms_output.put_line('From tables: ' || v_table_names);

    -- Commit the transaction if any records were deleted
   if v_total_deleted > 0 then
        --COMMIT;
      -- dbms_output.put_line('Issue a commit to make the changes permanent');
      NULL;
   else
      dbms_output.put_line('No records were deleted');
   end if;

exception
   when others then
      rollback;
      dbms_output.put_line('Fatal error occurred: ' || sqlerrm);
      dbms_output.put_line('Transaction rolled back');
      raise;
end delete_donor_unit_data;
```
