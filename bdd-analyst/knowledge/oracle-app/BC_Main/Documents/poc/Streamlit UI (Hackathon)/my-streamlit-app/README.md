# My Streamlit App

This project is a web application built using Streamlit that interacts with an Oracle Database. The application allows users to upload PDF documents and submit questions, which are processed and stored in the database.

## Features

- Upload PDF documents and extract their name and size.
- Store the uploaded document information in the Oracle Database using the `insert_new_doc` stored procedure.
- Submit questions through a text box, which are processed by the `generate_response` stored procedure.

## Project Structure

```
my-streamlit-app
├── src
│   ├── app.py                # Main entry point of the Streamlit application
│   ├── db
│   │   ├── __init__.py       # Package initializer for db
│   │   └── connection.py      # Database connection logic
│   ├── procedures
│   │   ├── __init__.py       # Package initializer for procedures
│   │   └── procedures.py      # Stored procedure calls
│   └── utils
│       ├── __init__.py       # Package initializer for utils
│       └── pdf_utils.py       # PDF handling utilities
├── requirements.txt           # Project dependencies
└── README.md                  # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-streamlit-app
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required packages:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   streamlit run src/app.py
   ```

## Usage

- Navigate to the application in your web browser.
- Use the file uploader to select and upload a PDF document.
- Enter a question in the provided text box and submit it.
- The application will process the inputs and store the relevant information in the Oracle Database.

## License

This project is licensed under the MIT License.