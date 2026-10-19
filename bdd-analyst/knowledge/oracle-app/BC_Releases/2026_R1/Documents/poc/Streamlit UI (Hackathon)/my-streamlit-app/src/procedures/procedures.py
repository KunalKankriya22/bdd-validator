import oracledb

def insert_new_doc(connection, doc_name, doc_size, doc_type, doc_content):
    cursor = connection.cursor()
    doc_id = cursor.var(oracledb.NUMBER)
    error_msg = cursor.var(oracledb.STRING)
    try:
        cursor.callproc("insert_my_docs_row", [doc_name, doc_size, doc_type, doc_content, doc_id, error_msg])
        connection.commit()
        return doc_id.getvalue(), error_msg.getvalue()
    except oracledb.DatabaseError as e:
        error, = e.args
        return None, error.message
    finally:
        cursor.close()

def generate_response(connection, question, doc_id):
    cursor = connection.cursor()
    try:
        response = cursor.callfunc("generate_text_response_genai", oracledb.CLOB, [question, doc_id])
        return response
    finally:
        cursor.close()