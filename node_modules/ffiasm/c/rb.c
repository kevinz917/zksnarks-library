#include "stdio.h"

static inline u_int32_t BR(u_int32_t x)
{
    x = (x >> 16) | (x << 16);
    x = ((x & 0xFF00FF00) >> 8) | ((x & 0x00FF00FF) << 8);
    x = ((x & 0xF0F0F0F0) >> 4) | ((x & 0x0F0F0F0F) << 4);
    x = ((x & 0xCCCCCCCC) >> 2) | ((x & 0x33333333) << 2);
    return ((x & 0xAAAAAAAA) >> 1) | ((x & 0x55555555) << 1);
}

int main() {
    int a = 0x12345678;

    for (int i=0; i<1000000000; i++) {
        a = BR(a);        
    }

    printf("Reversed Bit = %X, %X\n", a, BR(a));
}