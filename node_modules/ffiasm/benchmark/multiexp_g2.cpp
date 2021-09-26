#define COUNT_OPS

#include <stdio.h>
#include <stdlib.h>
#include "alt_bn128.hpp"
#include <time.h>


using namespace AltBn128;

__uint128_t g_lehmer64_state = 0xAAAAAAAAAAAAAAAALL;

// Fast random generator
// https://lemire.me/blog/2019/03/19/the-fastest-conventional-random-number-generator-that-can-pass-big-crush/

uint64_t lehmer64() {
  g_lehmer64_state *= 0xda942042e4dd58b5LL;
  return g_lehmer64_state >> 64;
}

int main(int argc, char **argv) {

    int N = atoi(argv[1]);

    uint8_t *scalars = new uint8_t[N*32];
    G2PointAffine *bases = new G2PointAffine[N];

    // random scalars
    for (int i=0; i<N*4; i++) {
        *((uint64_t *)(scalars + i*8)) = lehmer64();
    }

    G2.copy(bases[0], G2.one());
    G2.copy(bases[1], G2.one());

    for (int i=2; i<N; i++) {
        G2.add(bases[i], bases[i-1], bases[i-2]);
    }

    clock_t start, end;
    double cpu_time_used;

    G2Point p1;
    
    G2.resetCounters();
    start = clock();
    G2.multiMulByScalar(p1, bases, (uint8_t *)scalars, 32, N);
    end = clock();

    G2.printCounters();
    cpu_time_used = ((double) (end - start)) / CLOCKS_PER_SEC;
    printf("Time used: %.2lf\n", cpu_time_used);
    printf("Avg time per exp: %.2lf us\n", (cpu_time_used*1000000)/N);
    printf("Exps per second: %.2lf\n", (N / cpu_time_used));

}