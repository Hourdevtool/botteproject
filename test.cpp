#include <stdio.h>


int fibonacci(int n) {
    if (n == 0) {
        return 0;
    }
    else if (n == 1) {
        return 1;
    }
    else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}


int main() {
    int n_position;
   
    printf("Enter Fibonacci position (n): ");
    scanf("%d", &n_position);
   
    if (n_position < 0) {
        printf("Please enter an integer from 0 onwards.\n");
    } else {
        int result = fibonacci(n_position);
        printf("Fibonacci number at position %d is: %d\n", n_position, result);
    }
   
    return 0;
}
