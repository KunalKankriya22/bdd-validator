import oracledb
from dotenv import load_dotenv
import os
import requests
import time
from PyPDF2 import PdfReader
import streamlit as st

def call_insert_my_docs_row(conn23c, pdf_name, pdf_size, pdf_type, pdf_content):

    # Prepare and execute the stored procedure call
    try:
        cursor = conn23c.cursor()
        new_id = cursor.var(oracledb.NUMBER)
        error_msg = cursor.var(oracledb.STRING)  # Define the error_msg variable
        cursor.callproc("insert_my_docs_row", [pdf_name, pdf_size, pdf_type, pdf_content, new_id, error_msg])
        conn23c.commit()

        if error_msg.getvalue():
            print("Error message from procedure:", error_msg.getvalue())
        else:
            print("Procedure executed successfully! New ID: " + str(new_id.getvalue()))

        return new_id.getvalue()
    except oracledb.DatabaseError as e:
        error, = e.args
        print("Error:", error.message)
        return None
    finally:
        cursor.close()

def get_answers(conn23c, user_question, new_id):
    # Rest of your code remains unchanged
    cursor = conn23c.cursor()
    output = cursor.callfunc("generate_text_response_genai",oracledb.CLOB, [user_question, new_id])
    return output

def main():
    load_dotenv()
    st.set_page_config(page_title="Ask Question Based on PDF")
    st.info("Using OCI GenAI LLM and PLSQL access to Oracle AI Vector Search")
    st.header("Ask your question to get answers based on your pdf")

    username = os.getenv("user")
    password = os.getenv("password")
    dsn = os.getenv("dsn")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print(f"DSN: {dsn}")

    try:
       conn23c = oracledb.connect(user=username, password=password, dsn=dsn)
       print("Connection successful!")
    except Exception as e:
       print(f"Connection failed!: {e}")



    pdf = st.file_uploader("Upload your PDF", type="pdf")
    if pdf is not None:
        start_time = time.time()
        # pdf_reader = PdfReader(pdf)
        file_name = pdf.name
        file_size = pdf.size
        file_type = 'application/pdf'
        file_content = pdf.getvalue()

        # Call procedure to insert PDF into database and get new id
        new_id = call_insert_my_docs_row(conn23c,file_name, file_size, file_type, file_content)
        print (" the new id is "+ str(new_id))

        if new_id is not None:
            st.success('File uploaded successfully and inserted into the database.')
        else:
            st.error('Failed to insert the file into the database.')

        user_question = st.text_input("Ask a question about your PDF")
        if user_question:
            answer = get_answers(conn23c,user_question, new_id)
            st.markdown(answer)
            elapsed_time = time.time() - start_time
            st.caption(f"Total processing time: {round(elapsed_time, 1)} sec.")

if __name__ == '__main__':
    main()