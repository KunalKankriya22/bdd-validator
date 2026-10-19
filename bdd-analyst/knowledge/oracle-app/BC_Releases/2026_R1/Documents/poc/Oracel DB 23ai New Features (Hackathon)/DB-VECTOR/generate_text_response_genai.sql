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
