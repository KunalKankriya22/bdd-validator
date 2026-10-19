import streamlit as st
from db.connection import create_connection
from procedures.procedures import insert_new_doc, generate_response
import os

def main():
    # Initialize database connection
    conn = create_connection()

    st.title("RAG pdf search")
    st.info("Using OCI GenAI LLM and Oracle database 23ai Vector Search")
    st.header("Ask a question about the uploaded pdf document.")

    # File uploader for PDF documents
    uploaded_file = st.file_uploader("Upload a PDF document", type=["pdf"])

    if uploaded_file is not None:
        # Extract PDF name and size
        pdf_name = uploaded_file.name
        pdf_size = uploaded_file.size
        pdf_type = uploaded_file.type
        pdf_content = uploaded_file.getvalue()

        # Call the insert_new_doc procedure
        doc_id, message = insert_new_doc(conn, pdf_name, pdf_size, pdf_type, pdf_content)

        if doc_id is None:
            st.error(f"Error: {message}")
        else:
            st.success(f"Document uploaded successfully with ID: {doc_id}")

        # Text input for user question
        user_question = st.text_input("Enter your question:")

        if user_question:
            # Call the generate_response procedure
            response = generate_response(conn, user_question, doc_id)
            st.markdown(response)


        # Close the database connection
        #conn.close()

if __name__ == "__main__":
    main()