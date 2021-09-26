#include <stdint.h>

namespace MultByScalar {

#define MAX_CHUNK_SIZE_BITS 22

uint32_t log2 (uint32_t value);
uint32_t getChunk(uint8_t* scalars, uint32_t scalarSize,uint32_t chunkSize, uint32_t idx, uint32_t chunk);

template <typename BaseGroup, typename GroupElement>
void reduceChunk(BaseGroup &G, GroupElement* accs, uint32_t bitsPerChunk) {
    if (bitsPerChunk == 1) return;
    uint32_t half = (1 << (bitsPerChunk-1));  

    for (uint32_t i=0; i<half-1; i++) {
        G.add(accs[half-1], accs[half-1], accs[half+i]);
        G.add(accs[half+i], accs[half+i], accs[i]);
    }
    reduceChunk(G, accs + half, bitsPerChunk-1);
    for (uint32_t i=0; i<bitsPerChunk-1;i++) G.dbl(accs[half-1], accs[half-1]);
    G.add(accs[0], accs[half-1], accs[half] );
}


template <typename BaseGroup, typename GroupElement, typename BasesGroupElement>
void fastMultiMulByScalar(BaseGroup &G, GroupElement& r, BasesGroupElement *bases, uint8_t* scalars, uint32_t scalarSize, uint32_t n)
{
    if (n==0) {
        G.copy(r, G.zero());
        return;
    }
    uint32_t bitsPerChunk = log2(n);
    if (bitsPerChunk > MAX_CHUNK_SIZE_BITS) bitsPerChunk = MAX_CHUNK_SIZE_BITS;
    uint32_t nChunks = ((scalarSize*8 - 1 ) / bitsPerChunk)+1;  // +1 Is because we want a sign
    uint32_t accsPerChunk = (1 << (bitsPerChunk) )-1;  // In the chunks last bit is always zero.

    GroupElement *accs = new GroupElement[accsPerChunk * nChunks];
    for (uint32_t j=0; j<nChunks; j++) {
        for (uint32_t k=0; k<accsPerChunk; k++) {
            G.copy(accs[j*accsPerChunk+k], G.zero());
        }
    }

    for (uint32_t i=0; i<n; i++) {
        for (uint32_t j=0; j<nChunks; j++) {
            uint32_t c = getChunk(scalars, scalarSize, bitsPerChunk, i, j);
            if (c) {
                G.add(accs[j*accsPerChunk + c-1], accs[j*accsPerChunk + c-1], bases[i]);
            }
        }
    }

    for  (uint32_t j=0; j<nChunks; j++) {
        reduceChunk(G, accs + j*accsPerChunk, bitsPerChunk);
    }

    G.copy(r, accs[(nChunks-1)*accsPerChunk]);
    for  (int j=nChunks-2; j>=0; j--) {
        for (uint32_t k=0; k<bitsPerChunk; k++) G.dbl(r,r);
        G.add(r, r, accs[j*accsPerChunk]);
    }

    delete accs;
}

} // namespace