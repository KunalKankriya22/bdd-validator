#include <stdio.h>
main()
{

int ch;
int count=0;
ch=getchar();
while(ch !=EOF)
    {
    if (ch ==  13)
     putchar(10);
     else
     putchar(ch);
     ch=getchar();
    }
}
