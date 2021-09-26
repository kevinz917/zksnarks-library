
#include <stdint.h>
#include <memory.h>


int inline msb(uint64_t *n, int maxBit) {
    int cw = maxBit >> 6;
    while ((cw>=0) && (!n[cw])) cw --;

    if (n[cw] == 0) return - 1;
    return  (cw<<6)  + (63 - __builtin_clz(n[cw]));
}

void div(uint64_t *q, uint64_t *r, uint64_t *D, uint64_t *d, uint32_t n64) {

    memcpy(r, D, n64*8 );

    int msbd = msb(d, n64*64-1);

    if (msbd <0) assert(0); // Division by 0

    int msbD = msb(D, n64*64-1);

    int lsbd = (msbd - 64) >= 0 ? (msbd - 64) : 0;

    uint64_t d1 = extract64(d, lsbd);

    if (lsbd) d1 ++;
    
    while (msbD > msbd) {

        lsbD = (msbD - 127) >= 0 ? (msbD - 127) : 0;

        __int128 D1  = extract128(d, lsbd);

        uint64_t q1 = D1/d1;

        mul1AndSub(r, d, q1, lsbD - lsbd)

        msbD = msb(r, msbD);
    }

    if (r > d) r=r-d;

}