create or replace procedure insert_my_docs_row (
   p_file_name    in my_docs.file_name%type,
   p_file_size    in my_docs.file_size%type,
   p_file_type    in my_docs.file_type%type,
   p_file_content in my_docs.file_content%type,
   p_new_id       out number,
   p_error_msg    out varchar2
) is
   v_count number;
   v_id    number;
   new_id  number;
begin
   begin
      select id
        into new_id
        from my_docs
       where file_name = p_file_name
         and file_size = p_file_size;
   exception
      when no_data_found then
         insert into my_docs (
            file_name,
            file_size,
            file_type,
            file_content
         ) values ( p_file_name,
                    p_file_size,
                    p_file_type,
                    p_file_content ) returning id into new_id;
   end;
   p_new_id := new_id;
   p_error_msg := null;
   --dbms_output.put_line(new_id);
   commit;
exception
   when others then
        p_error_msg := 'Error: ' || sqlerrm;
        -- Exception handling here, for example, a rollback or a custom error message
        --dbms_output.put_line('Error: ' || sqlerrm);
        --RAISE;
end insert_my_docs_row;