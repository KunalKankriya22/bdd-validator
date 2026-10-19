 insert into MY_DOCS (
      file_name,
      file_size,
      file_type,
      file_content
   ) values ( 'Release_notes.pdf',
              dbms_lob.getlength(to_blob(bfilename(
                 'VEC_DUMP',
                 'Release_notes.pdf'
              ))),
              'PDF',
              to_blob(bfilename(
                 'VEC_DUMP',
                 'Release_notes.pdf'
              )) );

COMMIT;


INSERT into VECTOR_STORE ( doc_id, embed_id, embed_data, embed_vector) 
select  id, embed_id, text_chunk ,embed_vector 
from MY_DOCS dt
            CROSS JOIN TABLE(
                dbms_vector_chain.utl_to_embeddings(
                    dbms_vector_chain.utl_to_chunks(
                        dbms_vector_chain.utl_to_text(dt.file_content), 
                        json('{"by":"words","max":"300","split":"sentence","normalize":"all"}')
                    ),
                    json('{"provider":"database", "model":"All_MINILM_L6V2MODEL"}')
                )
            )  t
            CROSS JOIN JSON_TABLE(
                t.column_value, 
                '$[*]' COLUMNS (
                    embed_id NUMBER PATH '$.embed_id',
                    text_chunk VARCHAR2(4000) PATH '$.embed_data',
                    embed_vector CLOB PATH '$.embed_vector'
                )
            ) AS et;

COMMIT;



select generate_text_response_genai('List open bugs affecting Linux in Oracle Database 23ai', 1)  from dual;   