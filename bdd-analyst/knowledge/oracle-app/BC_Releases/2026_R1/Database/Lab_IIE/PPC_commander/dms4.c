/*  Written by Damon Nirode 8/13/2001			*/
/*  Modifications made 10/10/2003			*/
/*  3/2/2004						*/
/*	Added random number generator for file name	*/

#include <sys/wait.h>   /* for waitpid() */
#include <stdio.h>      /* for printf() and fprintf() */
#include <sys/socket.h> /* for socket(), bind(), and connect() */
#include <arpa/inet.h>  /* for sockaddr_in and inet_ntoa() */
#include <stdlib.h>     /* for atoi() and exit() */
#include <string.h>     /* for memset() */
#include <unistd.h>     /* for close() */
#include <time.h>       /* for time() */

#define RCVBUFSIZE 128   /* Size of receive buffer */
#define MAXPENDING 5    /* Maximum outstanding connection requests */
#define DELIMCHAR '\n'
#define FIELDSPERMSG 1
#define MAX_LINE 128    

void DieWithError(char *errorMessage);  /* Error handling function */

void HandleTCPClient(int clntSocket);   /* TCP client handling function */

int CreateTCPServerSocket(unsigned short port); /* Create TCP server socket */

int AcceptTCPConnection(int servSock);  /* Accept TCP connection request */

void DieWithError(char *errorMessage)

{
    perror(errorMessage);
    exit(1);
}

int ReceiveMessage(int s, char *buf, int maxLen)
{
    int received=0;
    int delimCount=0;
    int rv;   

    while ((received < maxLen) && (delimCount < FIELDSPERMSG))
    {
       rv = recv(s, buf+received, 1, 0);
       if (rv < 0)
          DieWithError("recv() failed");
       else if (rv == 0)
          DieWithError("Unexpected end of transmission");
       if (*(buf+received) == DELIMCHAR)
          delimCount += 1;
       received += 1;
    }
    return received;
}
             

void HandleTCPClient(int clntSocket)
{
    char echoBuffer[RCVBUFSIZE]; 
    int recvMsgSize;            
    char buf[MAX_LINE];
    char str1[MAX_LINE];
    char *p;
    int len;
    int count;
    int s, new_s;
    time_t t;
    char filename[15];
    FILE *fp;


    t = time(NULL);
    sprintf(filename,"%s%d","PPC_",t);  
    if((fp = fopen(filename, "a"))==NULL) 
    {
       puts("cannot open file");
       exit(1);
    }
    while ((len = ReceiveMessage(clntSocket, buf, MAX_LINE)) > 0) 
    {
       if (len >= MAX_LINE) 
       {
          len = MAX_LINE - 1;
       }
       buf[len] = 0;
       fprintf(fp,"%s", buf);
       strcpy(str1,buf);
       if((buf[0] == 'F') && (buf[1] == '8'))
       {
          count++;
       }
       else
       {
          count = 0;
       }
       if(count == 4)
       {
          fprintf(fp,"%s", "End of File Encountered\n");
          break;
       }
    }
       fprintf(fp,"%s", "Just before file close\n");
       fclose(fp);
       fprintf(fp,"%s", "Just before socket close\n");
    close(clntSocket);    /* Close client socket */
}

int CreateTCPServerSocket(unsigned short port)
{
    int sock;                        /* socket to create */
    struct sockaddr_in echoServAddr; /* Local address */

    /* Create socket for incoming connections */
    if ((sock = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP)) < 0)
        DieWithError("socket() failed");
      
    /* Construct local address structure */
    memset(&echoServAddr, 0, sizeof(echoServAddr));   /* Zero out structure */
    echoServAddr.sin_family = AF_INET;                /* Internet address family */
    echoServAddr.sin_addr.s_addr = htonl(INADDR_ANY); /* Any incoming interface */
    echoServAddr.sin_port = htons(port);              /* Local port */

    /* Bind to the local address */
    if (bind(sock, (struct sockaddr *) &echoServAddr, sizeof(echoServAddr)) < 0)
        DieWithError("bind() failed");

    /* Mark the socket so it will listen for incoming connections */
    if (listen(sock, MAXPENDING) < 0)
        DieWithError("listen() failed");

    return sock;
}

int AcceptTCPConnection(int servSock)
{
    int clntSock;                    /* Socket descriptor for client */
    struct sockaddr_in echoClntAddr; /* Client address */
    unsigned int clntLen;            /* Length of client address data structure */

    /* Set the size of the in-out parameter */
    clntLen = sizeof(echoClntAddr);
    
    /* Wait for a client to connect */
    if ((clntSock = accept(servSock, (struct sockaddr *) &echoClntAddr, 
           &clntLen)) < 0)
        DieWithError("accept() failed");
    
    /* clntSock is connected to a client! */
        printf("Handling client %s\n", inet_ntoa(echoClntAddr.sin_addr));

    return clntSock;
}

int main(int argc, char *argv[])
{
    int servSock;                    /* Socket descriptor for server */
    int clntSock;                    /* Socket descriptor for client */
    unsigned short echoServPort;     /* Server port */
    pid_t processID;                 /* Process ID from fork() */
    unsigned int childProcCount = 0; /* Number of child processes */ 

    if (argc != 2)     /* Test for correct number of arguments */
    {
        fprintf(stderr, "Usage:  %s <Server Port>\n", argv[0]);
        exit(1);
    }

    echoServPort = atoi(argv[1]);  /* First arg:  local port */
printf("EchoServport\n");
    servSock = CreateTCPServerSocket(echoServPort);
printf("servSock %d\n",servSock);

    for (;;) /* Run forever */
    {
        clntSock = AcceptTCPConnection(servSock);
printf("clntSock %d\n",clntSock);

        /* Fork child process and report any errors */
        printf("process: %d\n", (int) processID);

        if ((processID = fork()) < 0)
            DieWithError("fork() failed");
        else if (processID == 0)  /* If this is the child process */
        {
            close(servSock);   /* Child closes parent socket */
            HandleTCPClient(clntSock);

            exit(0);           /* Child process terminates */
        }

        printf("with child process: %d\n", (int) processID);
        close(clntSock);       /* Parent closes child socket descriptor */
        childProcCount++;      /* Increment number of outstanding child processes */

        while (childProcCount) /* Clean up all zombies */
        {
            processID = waitpid((pid_t) -1, NULL, WNOHANG);  /* Non-blocking wait */
            if (processID < 0)  /* waitpid() error? */
                DieWithError("waitpid() failed");
            else if (processID == 0)  /* No zombie to wait on */
                break;
            else
                childProcCount--;  /* Cleaned up after a child */
        }
    }
}
