# SERAPISU33_D3_Daas
 
To run the service locally run command:

docker-compose up

Alternatively, if it won't work:
Download the folder and in the downloaded directory run:

npm install  (if not existed)

It also requires to install the request and form-data modules:

npm install request
npm install form-data

# How to run the tool

In the Amuletdata.txt there is a sequence of question-answer exchange between 
Amulet and the user which can be given as input (one-to-one) to the interface.

The service can also be called via the url (in local execution):

http://127.0.0.1:3000/move

via a post method giving the message (question/answer) expressed in the amulet
format as input and it returns json data that includes the responding locutions
(if there are any) from daas


