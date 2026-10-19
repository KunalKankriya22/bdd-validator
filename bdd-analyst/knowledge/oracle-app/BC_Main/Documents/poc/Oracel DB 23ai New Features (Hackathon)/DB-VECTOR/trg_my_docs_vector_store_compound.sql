CREATE OR REPLACE TRIGGER trg_my_docs_vector_store_compound
FOR INSERT ON my_docs
COMPOUND TRIGGER

    TYPE t_id_tab IS TABLE OF my_docs.id%TYPE INDEX BY PLS_INTEGER;
    v_ids t_id_tab;

    AFTER EACH ROW IS
    BEGIN
        v_ids(v_ids.COUNT + 1) := :NEW.id;
    END AFTER EACH ROW;

    AFTER STATEMENT IS
    BEGIN
        FOR i IN 1 .. v_ids.COUNT LOOP
            INSERT INTO vector_store (doc_id, embed_id, embed_data, embed_vector)
            SELECT dt.id AS doc_id, 
                  et.embed_id, 
                  et.embed_data, 
                  to_vector(et.embed_vector) AS embed_vector
            FROM my_docs dt
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
                    embed_data VARCHAR2(4000) PATH '$.embed_data',
                    embed_vector CLOB PATH '$.embed_vector'
                )
            ) AS et
            WHERE dt.id = v_ids(i);
        END LOOP;
    END AFTER STATEMENT;

END trg_my_docs_vector_store_compound;