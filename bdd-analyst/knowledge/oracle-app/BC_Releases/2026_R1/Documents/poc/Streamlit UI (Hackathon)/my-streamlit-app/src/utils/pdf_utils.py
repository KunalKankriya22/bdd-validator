def extract_pdf_info(uploaded_file):
    if uploaded_file is not None:
        pdf_name = uploaded_file.name
        pdf_size = uploaded_file.size
        return pdf_name, pdf_size
    return None, None