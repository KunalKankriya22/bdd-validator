select * from my_docs;


select id, SUBSTR( REPLACE (REPLACE(TRIM( dbms_vector_chain.utl_to_text(dt.file_content)),'  ',' ') , CHR(10), ''), 1, 2000) as chars_2000
from MY_DOCS dt;


SELECT ct.* from 
MY_DOCS dt, 
dbms_vector_chain.utl_to_chunks(dbms_vector_chain.utl_to_text(dt.file_content)) ct where rownum < 4;


SELECT 
JSON_VALUE(C.column_value, '$.chunk_id' RETURNING NUMBER) AS id,
JSON_VALUE(C.column_value, '$.chunk_offset' RETURNING NUMBER) AS pos,
JSON_VALUE(C.column_value, '$.chunk_length' RETURNING NUMBER) AS chunk_length,
SUBSTR( REPLACE (REPLACE(TRIM( JSON_VALUE(C.column_value, '$.chunk_data')),'  ',' ') , CHR(10), ''), 1, 2000) AS chunk_txt 
FROM MY_DOCS dt, dbms_vector_chain.utl_to_chunks(dbms_vector_chain.utl_to_text(dt.file_content)) C where rownum < 4;

SELECT 
    JSON_VALUE(C.column_value, '$.chunk_id' RETURNING NUMBER) AS id,
    JSON_VALUE(C.column_value, '$.chunk_offset' RETURNING NUMBER) AS pos,
    JSON_VALUE(C.column_value, '$.chunk_length' RETURNING NUMBER) AS chunk_length,
    JSON_VALUE(C.column_value, '$.chunk_data') AS chunk_txt
FROM 
    MY_DOCS dt, 
    dbms_vector_chain.utl_to_chunks(
        dbms_vector_chain.utl_to_text(dt.file_content),
        JSON('{"by":"words","max":"300","overlap":"0","split":"recursively","language":"american","normalize":"all"}')
    ) C where rownum <= 4;

SET SERVEROUTPUT ON;


BEGIN
  DBMS_DATA_MINING.DROP_MODEL(model_name => 'All_MINILM_L6V2MODEL', force => true);

  dbms_vector.load_onnx_model(
    'VEC_DUMP',
    'all-MiniLM-L6-v2.onnx',
    'All_MINILM_L6V2MODEL',
    json(
          '{"function" : "embedding",'
          || '"input":{"input":["DATA"]}}'
        )
  );
End;  


SELECT MODEL_NAME, MINING_FUNCTION,
ALGORITHM, ALGORITHM_TYPE, round(MODEL_SIZE/1024/1024) MB FROM user_mining_models;


select file_name, file_size, text_chunk, embed_vector 
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
              id NUMBER PATH '$.embed_id',
              text_chunk VARCHAR2(4000) PATH '$.embed_data',
              embed_vector CLOB PATH '$.embed_vector'
          )
      ) AS et where rownum < 2;


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

SELECT * FROM vector_store;

select vector_embedding(All_MINILM_L6V2MODEL USING 'What is the result of the release version' as data) as embedding;


-- Vector search using cosine similarity.
WITH query_vector AS (
            SELECT VECTOR_EMBEDDING(All_MINILM_L6V2MODEL USING 'list some limitations' AS data) as embedding)
SELECT embed_id, embed_data
FROM VECTOR_STORE, query_vector
ORDER BY VECTOR_DISTANCE(EMBED_VECTOR, query_vector.embedding, COSINE)
FETCH APPROX FIRST 4 ROWS ONLY;


SELECT * FROM ALL_CREDENTIALS;


SET SERVEROUTPUT ON;
declare
  jo json_object_t;
begin
  jo := json_object_t();
  jo.put('user_ocid','ocid1.dummy');
  jo.put('tenancy_ocid','ocid1.dummy');
  jo.put('compartment_ocid','ocid1.dummy');
  jo.put('private_key','dummykey');
  jo.put('fingerprint','dummy');
  dbms_vector_chain.create_credential(
    credential_name   => 'GENAI_CRED',
    params            => json(jo.to_string));
end;



BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host => '*',
    ace => xs$ace_type(privilege_list => xs$name_list('connect'),
                       principal_name => 'vector',
                       principal_type => xs_acl.ptype_db));
END;


SELECT
    DBMS_VECTOR.UTL_TO_GENERATE_TEXT(
    data => 'In one sentence, who founded Oracle?',
    params => json (
        json_object(
            key 'provider' value 'ocigenai',
            key 'credential_name' value 'GENAI_CRED',
            key 'url' value 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat',
            key 'model' value 'cohere.command-r-08-2024'

        )
    )
    ) as response;	


SET SERVEROUTPUT ON;
declare
  input clob;
  params clob;
  output clob;
begin
  input := 'What is Oracle Text?';

  params := '
{
  "provider"       : "ocigenai",
  "credential_name": "GENAI_CRED",
  "url"            : "https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat",
  "model"          : "cohere.command-r-08-2024",
  "chatRequest"    : {
                      "maxTokens": 256
                     }
}';

  output := dbms_vector_chain.utl_to_generate_text(input, json(params));
  dbms_output.put_line(output);
  if output is not null then
    dbms_lob.freetemporary(output);
  end if;
exception
  when OTHERS THEN
    DBMS_OUTPUT.PUT_LINE (SQLERRM);
    DBMS_OUTPUT.PUT_LINE (SQLCODE);
end;




---- DIRECTLY ASK LLM - INTERNET ANSWERS


-- SEARCHING OUR DATABASE FOR THE RELEVANT CHUNKS.
-- ASK LLM the same question + above chunks


create or replace FUNCTION generate_text_response_genai(user_question VARCHAR2, doc_id number) RETURN CLOB IS
  messages CLOB;
  params_genai CLOB;
  output CLOB;
  message_line VARCHAR2(4000);
  message_cursor SYS_REFCURSOR;
  user_question_vec vector;
    search_query varchar2(4000);
BEGIN

  --vectorize the user_question
  select to_vector(vector_embedding(All_MINILM_L6V2MODEL USING user_question as data)) as embedding  into  user_question_vec ;
  -- Open the cursor using the provided query string
  search_query := 'SELECT EMBED_DATA from VECTOR_STORE where doc_id ='||doc_id||' ORDER BY vector_distance(EMBED_VECTOR, :user_question_vec, COSINE)'||
  ' FETCH   FIRST 10 ROWS ONLY ' ;
  OPEN message_cursor FOR search_query USING user_question_vec;

  -- Initialize messages CLOB
  messages := '';

  -- Loop through cursor results and construct messages
  LOOP
    FETCH message_cursor INTO message_line;
    EXIT WHEN message_cursor%NOTFOUND;

    -- Append message line to messages CLOB
    messages := messages || '{"message": "' || message_line || '"},' || CHR(10);
  END LOOP;
    -- Finally pass the user question
    messages := messages || '{"Question": "' || user_question  || '"},' || CHR(10);
  -- Close the cursor
  CLOSE message_cursor;

  -- Remove the trailing comma and newline character
  messages := RTRIM(messages, ',' || CHR(10));

  -- Construct params JSON
  -- In order to use the ocigenai provider below we have precreated the credentials
  -- Construct params JSON
  params_genai:=   '{
          "provider": "ocigenai",
          "credential_name" : "GENAI_CRED",
          "url": "https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat",
          "model": "cohere.command-r-08-2024",
          "chatRequest": {
            "maxTokens": 300}
          }';


-- dbms_output.put_line(messages);
  dbms_output.put_line(to_char(user_question_vec));

  -- Call UTL function to generate text
  output := dbms_vector_chain.utl_to_generate_text(messages, json(params_genai));
  dbms_output.put_line(output);
  -- Return the generated text
  RETURN output;

EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLERRM || SQLCODE;
END;


SELECT
    DBMS_VECTOR.UTL_TO_GENERATE_TEXT(
    data => 'In one sentence, who founded Oracle?',
    params => json (
        json_object(
            key 'provider' value 'ocigenai',
            key 'credential_name' value 'GENAI_CRED',
            key 'url' value 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat',
            key 'model' value 'cohere.command-r-08-2024'

        )
    )
    ) as response;	


select a.file_name,
       a.file_size,
       b.doc_id,
       b.count,
       b.avg_text_chunk_size,
       b.max_chunk_size
  from MY_DOCS a,
       (
          select doc_id,
                 count(*) count,
                 round(avg(length(embed_data))) avg_text_chunk_size,
                 max(length(embed_data)) max_chunk_size
            from vector_store
           group by doc_id
       ) b
 where a.id = b.doc_id;


select generate_text_response_genai('List specific points in the Oracle Database 23ai release notes', 1)  from dual;

Here is a list of specific points mentioned in the Oracle Database 23ai release notes:

- Restrictions for Oracle AI Vector Search:
   - SQL constructs with vector columns do not support distinct, count distinct, order by, group by, join conditions, or comparison operators.
   - Vector indexes do not support external tables, IOTs, clusters or cluster tables, global temporary tables, blockchain tables, immutable tables, or materialized views.
   - There is no support for function-based vector indexes, alter index DDL for vector indexes, or online creation of vector indexes.
   - Integration with Oracle Data Pump, Advanced Queuing, and Database Gateways is not supported for vector indexes with transportable tablespaces.
   - A maximum of 65535 dimensions is supported for vectors.
   - Data redaction is not supported for the VECTOR data type.

- Restrictions for JavaScript Object Notation (JSON) and JSON-Relational Duality Views:
   - General restrictions for JSON and specific restrictions for JSON-relational duality views are mentioned, but the details are not provided in the given text.

- Property Graph Features:
   - Oracle Graph Server and Client Release 25.1 works with Property Graph features of Oracle Database 23ai.
   - Visualizing GRAPH_TABLE queries on SQL Property Graphs is mentioned, but no further details are provided.

- Unrestricted Bulk Transactions:
   - The release notes mention restrictions for Unrestricted Bulk

  Here is a list of specific points mentioned in the Oracle Database 23ai release notes:

- Restrictions for Oracle AI Vector Search:
   - SQL constructs with vector columns have limitations on distinct, count distinct, order by, group by, and comparison operators.
   - Vector indexes do not support external tables, IOTs, clusters, global temporary tables, blockchain tables, immutable tables, materialized views, and function-based vector indexes.
   - Integration with Oracle Data Pump, Advanced Queuing, and Database Gateways is not supported for vector indexes.
   - A maximum of 65535 dimensions is supported for vectors.
   - Data redaction is not supported for the VECTOR data type.

- Restrictions for JavaScript Object Notation (JSON) and JSON-Relational Duality Views:
   - General restrictions and specific limitations for JSON and JSON-relational duality views are mentioned, but the details are not provided in the given text.

- Property Graph Features:
   - Oracle Graph Server and Client Release 25.1 works with Property Graph features in Oracle Database 23ai.
   - Specific details about the property graph features are not provided in the text.

- Unrestricted Bulk Transactions:
   - Restrictions for Unrestricted Bulk Transactions are mentioned, but the specific details are not included in the text.

- Deprecated and Desupported Features:
   - Oracle Database 23ai introduces behavior changes and new features, including deprecated and des



select generate_text_response_genai('List open bugs affecting Linux in Oracle Database 23ai', 1)  from dual;   
- Bug 36756459
- Bug 36326543
- Bug 35517929

Open Bugs Affecting Linux:
- Bug 36326543
- Bug 35517929
- Bug 36756459

select generate_text_response_genai('What is Bug 36756459', 1)  from dual;   
Bug 36756459 is related to the use of Oracle Database Configuration Assistant (DBCA) with Oracle Data Guard for database move operations. It states that if DBCA is used for a database move, the Data Guard Broker configuration files must be moved to a mount point location outside of the earlier release Oracle home before starting the operation. The DG_BROKER_CONFIG_FILE parameters should also be updated to specify this new location.