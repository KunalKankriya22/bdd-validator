#!/bin/bash

python3 --version
sudo dnf -y install python3.12
sudo alternatives --set python3 /user/bin/python3.12
python3 --version
sudo dnf -y install python3.12-devel python3.12-pip python3.12-setuptools python3.12-wheel libcanberra-gtk*
sudo su - oracle -c "pip3 install --upgrade pip"
sudo su - oracle -c "python3 -m pip install oracledb --upgrade --user"
sudo su - oracle -c "pip3 install python-dotenv"
sudo su - oracle -c "pip3 install PyPDF2"
sudo su - oracle -c "pip3 install langchain-community"
sudo su - oracle -c "pip3 install sentence_transformers"
sudo su - oracle -c "pip3 install -U langchain-huggingface"
sudo su - oracle -c "pip3 install oci"
sudo su - oracle -c "pip3 install fastembed"
sudo su - oracle -c "pip3 install streamlit"
sudo su - oracle -c "pip3 install ipython"